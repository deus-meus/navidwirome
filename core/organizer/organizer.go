package organizer

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

// SanitizeSegment cleans path traversal, separators, invalid characters, and null bytes.
func SanitizeSegment(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "Unknown"
	}

	// Remove null bytes
	name = strings.ReplaceAll(name, "\x00", "")

	// Remove traversal dots at start
	for strings.HasPrefix(name, "../") || strings.HasPrefix(name, "..\\") {
		name = strings.TrimPrefix(name, "../")
		name = strings.TrimPrefix(name, "..\\")
	}

	// Replace separators and invalid filesystem chars
	replacer := strings.NewReplacer(
		"/", "_",
		"\\", "_",
		":", "_",
		"*", "_",
		"?", "_",
		"\"", "_",
		"<", "_",
		">", "_",
		"|", "_",
	)
	name = replacer.Replace(name)
	name = strings.TrimSpace(name)
	if name == "" {
		return "Unknown"
	}
	return name
}

// ResolveTargetPath builds the destination filepath based on sanitized metadata.
func ResolveTargetPath(musicFolder, artist, album, trackNum, title, ext string) string {
	cleanArtist := strings.TrimSpace(artist)
	cleanAlbum := strings.TrimSpace(album)
	cleanTitle := SanitizeSegment(title)

	if !strings.HasPrefix(ext, ".") && ext != "" {
		ext = "." + ext
	}

	// Fallback to _Inbox if artist or album is missing
	if cleanArtist == "" || cleanAlbum == "" {
		return filepath.Join(musicFolder, "_Inbox", cleanTitle+ext)
	}

	sanitizedArtist := SanitizeSegment(cleanArtist)
	sanitizedAlbum := SanitizeSegment(cleanAlbum)
	sanitizedTrackNum := strings.TrimSpace(trackNum)

	var filename string
	if sanitizedTrackNum != "" {
		filename = fmt.Sprintf("%s - %s%s", sanitizedTrackNum, cleanTitle, ext)
	} else {
		filename = fmt.Sprintf("%s%s", cleanTitle, ext)
	}

	return filepath.Join(musicFolder, sanitizedArtist, sanitizedAlbum, filename)
}

// MoveFileSafely moves a file from src to dst, creating parent directories and avoiding collisions.
func MoveFileSafely(src, dst string) (string, error) {
	dstDir := filepath.Dir(dst)
	if err := os.MkdirAll(dstDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create directory %s: %w", dstDir, err)
	}

	// Resolve collision if destination already exists
	finalDst := dst
	ext := filepath.Ext(dst)
	base := strings.TrimSuffix(dst, ext)
	counter := 1

	for {
		if _, err := os.Stat(finalDst); os.IsNotExist(err) {
			break
		}
		finalDst = fmt.Sprintf("%s (%d)%s", base, counter, ext)
		counter++
	}

	// Attempt atomic rename first (fast if same filesystem)
	err := os.Rename(src, finalDst)
	if err == nil {
		return finalDst, nil
	}

	// Fallback to copy + delete if cross-device link
	srcFile, err := os.Open(src)
	if err != nil {
		return "", fmt.Errorf("failed to open source file %s: %w", src, err)
	}
	defer srcFile.Close()

	dstFile, err := os.Create(finalDst)
	if err != nil {
		return "", fmt.Errorf("failed to create destination file %s: %w", finalDst, err)
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return "", fmt.Errorf("failed to copy file: %w", err)
	}

	srcFile.Close()
	_ = os.Remove(src)

	return finalDst, nil
}

var cleanupPattern = regexp.MustCompile(`(?i)\s*[\(\[](official\s*(audio|video|music\s*video|lyric\s*video)?|lyrics?|lyric\s*video|visualizer|audio|hd|4k)[\)\]]`)

// ParseFilenameMetadata extracts artist and title from common filename patterns (e.g. "Artist - Title").
func ParseFilenameMetadata(filename string) (string, string) {
	base := strings.TrimSuffix(filepath.Base(filename), filepath.Ext(filename))
	cleaned := cleanupPattern.ReplaceAllString(base, "")
	cleaned = strings.TrimSpace(cleaned)

	parts := strings.Split(cleaned, " - ")
	if len(parts) == 2 {
		return strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1])
	} else if len(parts) >= 3 {
		if _, err := strconv.Atoi(strings.TrimSpace(parts[0])); err == nil {
			return strings.TrimSpace(parts[1]), strings.TrimSpace(strings.Join(parts[2:], " - "))
		}
		return strings.TrimSpace(parts[0]), strings.TrimSpace(strings.Join(parts[1:], " - "))
	}

	return "", cleaned
}

// ResolveCoverFilename generates an artwork filename based on song/album metadata.
// E.g. "Artist - Album.jpg" or "Artist - Title.jpg" or "Title.jpg".
// Fallback is "cover.jpg" if metadata is empty.
func ResolveCoverFilename(artist, album, title, ext string) string {
	cleanArtist := strings.TrimSpace(artist)
	cleanAlbum := strings.TrimSpace(album)
	cleanTitle := strings.TrimSpace(title)

	if ext == "" {
		ext = ".jpg"
	} else if !strings.HasPrefix(ext, ".") {
		ext = "." + ext
	}

	var baseName string
	if cleanArtist != "" && cleanAlbum != "" {
		baseName = fmt.Sprintf("%s - %s", SanitizeSegment(cleanArtist), SanitizeSegment(cleanAlbum))
	} else if cleanAlbum != "" {
		baseName = SanitizeSegment(cleanAlbum)
	} else if cleanArtist != "" && cleanTitle != "" {
		baseName = fmt.Sprintf("%s - %s", SanitizeSegment(cleanArtist), SanitizeSegment(cleanTitle))
	} else if cleanTitle != "" {
		baseName = SanitizeSegment(cleanTitle)
	} else {
		baseName = "cover"
	}

	return baseName + ext
}
