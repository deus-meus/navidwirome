package nativeapi

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/Masterminds/squirrel"
	"github.com/go-chi/chi/v5"
	"github.com/navidrome/navidrome/conf"
	"github.com/navidrome/navidrome/core/fingerprint"
	"github.com/navidrome/navidrome/core/organizer"
	"github.com/navidrome/navidrome/core/tagger"
	"github.com/navidrome/navidrome/log"
	"github.com/navidrome/navidrome/model"
	"github.com/navidrome/navidrome/model/request"
	"go.senan.xyz/taglib"
)

func (api *Router) addMusicMutationRoute(r chi.Router) {
	r.Route("/music", func(r chi.Router) {
		r.Post("/upload", api.handleMusicUpload)
		r.Post("/identify", api.handleMusicIdentify)
		r.Route("/track/{id}", func(r chi.Router) {
			r.Put("/tags", api.handleUpdateTrackTags)
			r.Delete("/", api.handleDeleteTrack)
		})
		r.Delete("/track/{id}", api.handleDeleteTrack)
		r.Route("/album/{id}", func(r chi.Router) {
			r.Delete("/", api.handleDeleteAlbum)
		})
		r.Delete("/album/{id}", api.handleDeleteAlbum)
	})
}

func (api *Router) handleMusicUpload(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, ok := request.UserFrom(ctx)
	if !ok || !user.AllowedToUpload() {
		http.Error(w, "Forbidden: you do not have permission to upload music", http.StatusForbidden)
		return
	}

	// 500MB max per upload request
	maxUploadSize := int64(500 << 20)
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		log.Error(ctx, "Error parsing upload multipart form", err)
		http.Error(w, "invalid form or file too large", http.StatusBadRequest)
		return
	}
	defer func() {
		if r.MultipartForm != nil {
			_ = r.MultipartForm.RemoveAll()
		}
	}()

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "missing file field", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Stage file in temporary cache
	tempDir := filepath.Join(os.TempDir(), "navidwirome_uploads")
	_ = os.MkdirAll(tempDir, 0755)
	tempFile, err := os.CreateTemp(tempDir, "upload_*.tmp")
	if err != nil {
		http.Error(w, "failed to create staging buffer", http.StatusInternalServerError)
		return
	}
	defer func() {
		tempFile.Close()
		_ = os.Remove(tempFile.Name())
	}()

	if _, err := io.Copy(tempFile, file); err != nil {
		http.Error(w, "failed to stream upload", http.StatusInternalServerError)
		return
	}
	tempPath := tempFile.Name()
	tempFile.Close()

	origFilename := header.Filename
	ext := filepath.Ext(origFilename)
	base := strings.TrimSuffix(origFilename, ext)

	// Read existing tags if any
	title := base
	artist := ""
	album := ""
	trackNum := ""
	tags, err := taglib.ReadTags(tempPath)
	if err == nil {
		if len(tags["TITLE"]) > 0 && strings.TrimSpace(tags["TITLE"][0]) != "" {
			title = tags["TITLE"][0]
		}
		if len(tags["ARTIST"]) > 0 {
			artist = tags["ARTIST"][0]
		}
		if len(tags["ALBUM"]) > 0 {
			album = tags["ALBUM"][0]
		}
		if len(tags["TRACKNUMBER"]) > 0 {
			trackNum = tags["TRACKNUMBER"][0]
		}
	}

	// If auto-identify requested or missing metadata, try AcoustID
	var coverURL string
	client := fingerprint.NewClient()
	autoTag := r.URL.Query().Get("autoTag") == "true" ||
		r.URL.Query().Get("auto_identify") == "true" ||
		r.FormValue("autoTag") == "true" ||
		r.FormValue("auto_identify") == "true"
	if autoTag || (artist == "" && album == "") {
		if meta, err := client.IdentifyFile(ctx, tempPath); err == nil && meta != nil {
			if meta.Title != "" {
				title = meta.Title
			}
			if meta.Artist != "" {
				artist = meta.Artist
			}
			if meta.Album != "" {
				album = meta.Album
			}
			if meta.CoverArtURL != "" {
				coverURL = meta.CoverArtURL
			}
			// Write identified tags into staged file
			_ = tagger.WriteTags(tempPath, tagger.TagUpdates{
				Title:  title,
				Artist: artist,
				Album:  album,
			})
		}
	}

	// Fallback: If artist is still empty, parse from filename
	if artist == "" {
		if parsedArtist, parsedTitle := organizer.ParseFilenameMetadata(origFilename); parsedArtist != "" {
			artist = parsedArtist
			if title == base || title == "" {
				title = parsedTitle
			}
			_ = tagger.WriteTags(tempPath, tagger.TagUpdates{
				Title:  title,
				Artist: artist,
			})
		}
	}

	// Fallback: If album is empty or coverURL is empty, search online via iTunes
	if (album == "" || coverURL == "") && artist != "" && title != "" {
		if itunesAlbum, itunesCover, err := client.SearchTrack(ctx, artist, title); err == nil {
			if album == "" && itunesAlbum != "" {
				album = itunesAlbum
				_ = tagger.WriteTags(tempPath, tagger.TagUpdates{
					Album: album,
				})
			}
			if coverURL == "" && itunesCover != "" {
				coverURL = itunesCover
			}
		}
	}

	musicFolder := conf.Server.MusicFolder
	if musicFolder == "" {
		musicFolder = os.TempDir()
	}

	targetPath := organizer.ResolveTargetPath(musicFolder, artist, album, trackNum, title, ext)
	finalPath, err := organizer.MoveFileSafely(tempPath, targetPath)
	if err != nil {
		log.Error(ctx, "Failed to move uploaded file to target", "err", err, "target", targetPath)
		http.Error(w, "failed to organize file into library", http.StatusInternalServerError)
		return
	}

	// Download album cover if target is an organized album folder
	albumDir := filepath.Dir(finalPath)
	if albumDir != musicFolder && filepath.Base(albumDir) != "_Inbox" && !hasArtworkInDir(albumDir) {
		coverFilename := organizer.ResolveCoverFilename(artist, album, title, ".jpg")
		_ = client.DownloadCoverArtWithFallbackNamed(ctx, coverURL, artist, title, albumDir, coverFilename)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"path":    finalPath,
		"title":   title,
		"artist":  artist,
		"album":   album,
	})
}

func (api *Router) handleMusicIdentify(w http.ResponseWriter, r *http.Request) {
	user, ok := request.UserFrom(r.Context())
	if !ok || (!user.AllowedToUpload() && !user.AllowedToEditTags()) {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var filePath string
	var filename string
	trackID := r.URL.Query().Get("id")
	if trackID != "" {
		if mf, err := api.ds.MediaFile(r.Context()).Get(trackID); err == nil && mf != nil {
			filePath = mf.Path
			filename = filepath.Base(mf.Path)
		}
	}

	if filePath == "" {
		r.Body = http.MaxBytesReader(w, r.Body, 50<<20)
		if err := r.ParseMultipartForm(10 << 20); err != nil {
			http.Error(w, "invalid form", http.StatusBadRequest)
			return
		}
		defer func() {
			if r.MultipartForm != nil {
				_ = r.MultipartForm.RemoveAll()
			}
		}()

		file, header, err := r.FormFile("file")
		if err != nil {
			http.Error(w, "missing track id or file", http.StatusBadRequest)
			return
		}
		defer file.Close()
		filename = header.Filename

		tempFile, err := os.CreateTemp("", "identify_*.tmp")
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}
		defer func() {
			tempFile.Close()
			_ = os.Remove(tempFile.Name())
		}()

		_, _ = io.Copy(tempFile, file)
		filePath = tempFile.Name()
		tempFile.Close()
	}

	client := fingerprint.NewClient()
	meta, err := client.IdentifyFile(r.Context(), filePath)
	if err != nil {
		// AcoustID fallback: try filename metadata parser
		parsedArtist, parsedTitle := organizer.ParseFilenameMetadata(filename)
		if parsedArtist != "" {
			itunesAlbum, itunesCover, searchErr := client.SearchTrack(r.Context(), parsedArtist, parsedTitle)
			if searchErr == nil {
				meta = &fingerprint.TrackMetadata{
					Artist:      parsedArtist,
					Title:       parsedTitle,
					Album:       itunesAlbum,
					CoverArtURL: itunesCover,
				}
			}
		}
		if meta == nil {
			http.Error(w, "identification failed: "+err.Error(), http.StatusNotFound)
			return
		}
	} else if meta != nil && (meta.CoverArtURL == "" || meta.Album == "") {
		if itunesAlbum, itunesCover, err := client.SearchTrack(r.Context(), meta.Artist, meta.Title); err == nil {
			if meta.Album == "" {
				meta.Album = itunesAlbum
			}
			if meta.CoverArtURL == "" {
				meta.CoverArtURL = itunesCover
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(meta)
}

func (api *Router) handleUpdateTrackTags(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, ok := request.UserFrom(ctx)
	if !ok || !user.AllowedToEditTags() {
		http.Error(w, "Forbidden: you do not have permission to edit tags", http.StatusForbidden)
		return
	}

	trackID := chi.URLParam(r, "id")
	if trackID == "" {
		http.Error(w, "missing track id", http.StatusBadRequest)
		return
	}

	var updates tagger.TagUpdates
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "invalid JSON payload", http.StatusBadRequest)
		return
	}

	mediaFile, err := api.ds.MediaFile(ctx).Get(trackID)
	if err != nil {
		http.Error(w, "track not found", http.StatusNotFound)
		return
	}

	musicFolder := conf.Server.MusicFolder
	if musicFolder == "" {
		musicFolder = os.TempDir()
	}

	fullSourcePath := mediaFile.Path
	if !filepath.IsAbs(fullSourcePath) {
		fullSourcePath = filepath.Join(musicFolder, fullSourcePath)
	}

	// Update physical file tags if file exists
	if _, err := os.Stat(fullSourcePath); err == nil {
		if err := tagger.WriteTags(fullSourcePath, updates); err != nil {
			log.Error(ctx, "Failed to write tags to audio file", "err", err, "path", fullSourcePath)
			http.Error(w, "failed to write tags to audio file", http.StatusInternalServerError)
			return
		}
	}

	// Update database record
	if updates.Title != "" {
		mediaFile.Title = updates.Title
	}
	if updates.Artist != "" {
		mediaFile.Artist = updates.Artist
	}
	if updates.Album != "" {
		mediaFile.Album = updates.Album
	}

	// Reorganize physical file if artist and album are known
	if mediaFile.Artist != "" && mediaFile.Album != "" {
		targetPath := organizer.ResolveTargetPath(musicFolder, mediaFile.Artist, mediaFile.Album, updates.TrackNumber, mediaFile.Title, filepath.Ext(fullSourcePath))
		if targetPath != fullSourcePath {
			if newPath, err := organizer.MoveFileSafely(fullSourcePath, targetPath); err == nil {
				if relPath, relErr := filepath.Rel(musicFolder, newPath); relErr == nil && !strings.HasPrefix(relPath, "..") {
					mediaFile.Path = relPath
				} else {
					mediaFile.Path = newPath
				}
				fullSourcePath = newPath
			}
		}
	}

	// Download album cover if not present
	albumDir := filepath.Dir(fullSourcePath)
	if albumDir != musicFolder && filepath.Base(albumDir) != "_Inbox" && !hasArtworkInDir(albumDir) {
		coverFilename := organizer.ResolveCoverFilename(mediaFile.Artist, mediaFile.Album, mediaFile.Title, ".jpg")
		client := fingerprint.NewClient()
		_ = client.DownloadCoverArtWithFallbackNamed(ctx, updates.CoverArtURL, mediaFile.Artist, mediaFile.Title, albumDir, coverFilename)
	}

	_ = api.ds.MediaFile(ctx).Put(mediaFile)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"track":   mediaFile,
	})
}

func (api *Router) handleDeleteTrack(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, ok := request.UserFrom(ctx)
	if !ok || !user.IsAdmin {
		http.Error(w, "Forbidden: only admins can delete tracks", http.StatusForbidden)
		return
	}

	trackID := chi.URLParam(r, "id")
	if trackID == "" {
		http.Error(w, "missing track id", http.StatusBadRequest)
		return
	}

	mediaFile, err := api.ds.MediaFile(ctx).Get(trackID)
	if err != nil {
		http.Error(w, "track not found", http.StatusNotFound)
		return
	}

	// Remove physical file from disk
	musicFolder := conf.Server.MusicFolder
	if musicFolder == "" {
		musicFolder = os.TempDir()
	}
	filePath := mediaFile.Path
	if !filepath.IsAbs(filePath) {
		filePath = filepath.Join(musicFolder, filePath)
	}
	if _, err := os.Stat(filePath); err == nil {
		if err := os.Remove(filePath); err != nil {
			log.Error(ctx, "Failed to delete track file from disk", "err", err, "path", filePath)
			http.Error(w, "failed to delete file from disk", http.StatusInternalServerError)
			return
		}
	}

	// Delete from database
	if err := api.ds.MediaFile(ctx).Delete(trackID); err != nil {
		log.Error(ctx, "Failed to delete track from database", "err", err, "id", trackID)
		http.Error(w, "failed to delete track from database", http.StatusInternalServerError)
		return
	}

	// Run GC to automatically purge empty album/artist/folder records from SQLite
	_ = api.ds.GC(ctx)

	// Clean up parent directory if empty
	parentDir := filepath.Dir(filePath)
	if parentDir != musicFolder && filepath.Base(parentDir) != "_Inbox" {
		entries, _ := os.ReadDir(parentDir)
		if len(entries) == 0 {
			_ = os.Remove(parentDir)
		} else if len(entries) == 1 && strings.HasPrefix(strings.ToLower(entries[0].Name()), "cover.") {
			_ = os.Remove(filepath.Join(parentDir, entries[0].Name()))
			_ = os.Remove(parentDir)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"deleted": trackID,
	})
}

func (api *Router) handleDeleteAlbum(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, ok := request.UserFrom(ctx)
	if !ok || !user.IsAdmin {
		http.Error(w, "Forbidden: only admins can delete albums", http.StatusForbidden)
		return
	}

	albumID := chi.URLParam(r, "id")
	if albumID == "" {
		http.Error(w, "missing album id", http.StatusBadRequest)
		return
	}

	mfs, err := api.ds.MediaFile(ctx).GetAll(model.QueryOptions{
		Filters: squirrel.Eq{"album_id": albumID},
	})
	if err != nil {
		log.Error(ctx, "Failed to query tracks for album deletion", "err", err, "albumID", albumID)
		http.Error(w, "failed to query album tracks", http.StatusInternalServerError)
		return
	}

	musicFolder := conf.Server.MusicFolder
	if musicFolder == "" {
		musicFolder = os.TempDir()
	}

	parentDirs := make(map[string]bool)
	for _, mf := range mfs {
		filePath := mf.Path
		if !filepath.IsAbs(filePath) {
			filePath = filepath.Join(musicFolder, filePath)
		}
		if _, err := os.Stat(filePath); err == nil {
			_ = os.Remove(filePath)
		}
		_ = api.ds.MediaFile(ctx).Delete(mf.ID)
		parentDir := filepath.Dir(filePath)
		if parentDir != musicFolder && filepath.Base(parentDir) != "_Inbox" {
			parentDirs[parentDir] = true
		}
	}

	// Run GC to purge the empty album, empty artists, and annotations from database
	_ = api.ds.GC(ctx)

	// Clean up empty directories
	for dir := range parentDirs {
		entries, _ := os.ReadDir(dir)
		if len(entries) == 0 {
			_ = os.Remove(dir)
		} else if len(entries) == 1 && (isArtworkFile(entries[0].Name()) || strings.HasPrefix(strings.ToLower(entries[0].Name()), "cover.")) {
			_ = os.Remove(filepath.Join(dir, entries[0].Name()))
			_ = os.Remove(dir)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"deleted": albumID,
	})
}

func isArtworkFile(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	return ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".webp"
}

func hasArtworkInDir(dir string) bool {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return false
	}
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		if isArtworkFile(e.Name()) {
			return true
		}
	}
	return false
}
