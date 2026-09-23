package tagger

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"go.senan.xyz/taglib"
)

type TagUpdates struct {
	Title       string `json:"title"`
	Artist      string `json:"artist"`
	Album       string `json:"album"`
	Year        string `json:"year"`
	Genre       string `json:"genre"`
	TrackNumber string `json:"trackNumber"`
	DiscNumber  string `json:"discNumber"`
	Comment     string `json:"comment"`
	CoverArtURL string `json:"coverArtURL,omitempty"`
}

// WriteTags updates audio metadata safely and atomically.
func WriteTags(filePath string, updates TagUpdates) error {
	// Verify file exists
	if _, err := os.Stat(filePath); err != nil {
		return err
	}

	// Prepare atomic temporary file in same directory
	dir := filepath.Dir(filePath)
	base := filepath.Base(filePath)
	tmpFile, err := os.CreateTemp(dir, fmt.Sprintf(".tmp_tag_*_%s", base))
	if err != nil {
		return fmt.Errorf("failed to create temporary file for tag writing: %w", err)
	}
	tmpPath := tmpFile.Name()
	defer func() {
		// Clean up temporary file if it still exists (i.e. not renamed)
		_ = os.Remove(tmpPath)
	}()

	// Copy original content to temp file
	src, err := os.Open(filePath)
	if err != nil {
		tmpFile.Close()
		return fmt.Errorf("failed to open source audio file: %w", err)
	}

	_, err = io.Copy(tmpFile, src)
	src.Close()
	tmpFile.Close()
	if err != nil {
		return fmt.Errorf("failed to copy audio file to temporary staging: %w", err)
	}

	// Build tags map for taglib
	tags := make(map[string][]string)
	if strings.TrimSpace(updates.Title) != "" {
		tags["TITLE"] = []string{strings.TrimSpace(updates.Title)}
	}
	if strings.TrimSpace(updates.Artist) != "" {
		tags["ARTIST"] = []string{strings.TrimSpace(updates.Artist)}
	}
	if strings.TrimSpace(updates.Album) != "" {
		tags["ALBUM"] = []string{strings.TrimSpace(updates.Album)}
	}
	if strings.TrimSpace(updates.Year) != "" {
		tags["DATE"] = []string{strings.TrimSpace(updates.Year)}
	}
	if strings.TrimSpace(updates.Genre) != "" {
		tags["GENRE"] = []string{strings.TrimSpace(updates.Genre)}
	}
	if strings.TrimSpace(updates.TrackNumber) != "" {
		tags["TRACKNUMBER"] = []string{strings.TrimSpace(updates.TrackNumber)}
	}
	if strings.TrimSpace(updates.DiscNumber) != "" {
		tags["DISCNUMBER"] = []string{strings.TrimSpace(updates.DiscNumber)}
	}
	if strings.TrimSpace(updates.Comment) != "" {
		tags["COMMENT"] = []string{strings.TrimSpace(updates.Comment)}
	}

	// Write tags using TagLib
	if err := taglib.WriteTags(tmpPath, tags, 0); err != nil {
		return fmt.Errorf("taglib write failed: %w", err)
	}

	// Atomically replace original file with updated file
	if err := os.Rename(tmpPath, filePath); err != nil {
		return fmt.Errorf("failed to atomically replace original audio file: %w", err)
	}

	return nil
}
