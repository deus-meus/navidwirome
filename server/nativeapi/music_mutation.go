package nativeapi

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/navidrome/navidrome/conf"
	"github.com/navidrome/navidrome/core/fingerprint"
	"github.com/navidrome/navidrome/core/organizer"
	"github.com/navidrome/navidrome/core/tagger"
	"github.com/navidrome/navidrome/log"
	"github.com/navidrome/navidrome/model/request"
	"go.senan.xyz/taglib"
)

func (api *Router) addMusicMutationRoute(r chi.Router) {
	r.Route("/music", func(r chi.Router) {
		r.Post("/upload", api.handleMusicUpload)
		r.Post("/identify", api.handleMusicIdentify)
		r.Route("/track/{id}", func(r chi.Router) {
			r.Put("/tags", api.handleUpdateTrackTags)
		})
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
	autoTag := r.URL.Query().Get("autoTag") == "true" || r.FormValue("autoTag") == "true"
	if autoTag || (artist == "" && album == "") {
		client := fingerprint.NewClient()
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
			// Write identified tags into staged file
			_ = tagger.WriteTags(tempPath, tagger.TagUpdates{
				Title:  title,
				Artist: artist,
				Album:  album,
			})
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

	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "missing file", http.StatusBadRequest)
		return
	}
	defer file.Close()

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
	tempPath := tempFile.Name()
	tempFile.Close()

	client := fingerprint.NewClient()
	meta, err := client.IdentifyFile(r.Context(), tempPath)
	if err != nil {
		http.Error(w, "identification failed: "+err.Error(), http.StatusNotFound)
		return
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

	// Update physical file tags if file exists
	if _, err := os.Stat(mediaFile.Path); err == nil {
		if err := tagger.WriteTags(mediaFile.Path, updates); err != nil {
			log.Error(ctx, "Failed to write tags to audio file", "err", err, "path", mediaFile.Path)
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
	_ = api.ds.MediaFile(ctx).Put(mediaFile)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"track":   mediaFile,
	})
}
