package tagger_test

import (
	"io"
	"os"
	"path/filepath"
	"testing"

	"github.com/navidrome/navidrome/core/tagger"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.senan.xyz/taglib"
)

func copyFixture(t *testing.T, src, dst string) {
	in, err := os.Open(src)
	require.NoError(t, err)
	defer in.Close()

	out, err := os.Create(dst)
	require.NoError(t, err)
	defer out.Close()

	_, err = io.Copy(out, in)
	require.NoError(t, err)
}

func TestWriteTags_MP3(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "tagger_test_*")
	require.NoError(t, err)
	defer os.RemoveAll(tmpDir)

	targetFile := filepath.Join(tmpDir, "test.mp3")
	copyFixture(t, "../../tests/fixtures/test.mp3", targetFile)

	updates := tagger.TagUpdates{
		Title:       "Updated Song Title",
		Artist:      "Updated Artist Name",
		Album:       "Updated Album Name",
		Year:        "2026",
		Genre:       "Progressive Rock",
		TrackNumber: "7",
	}

	err = tagger.WriteTags(targetFile, updates)
	require.NoError(t, err)

	// Read back and verify tags
	tags, err := taglib.ReadTags(targetFile)
	require.NoError(t, err)

	assert.Contains(t, tags["TITLE"], "Updated Song Title")
	assert.Contains(t, tags["ARTIST"], "Updated Artist Name")
	assert.Contains(t, tags["ALBUM"], "Updated Album Name")
	assert.Contains(t, tags["GENRE"], "Progressive Rock")
}

func TestWriteTags_FLAC(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "tagger_flac_test_*")
	require.NoError(t, err)
	defer os.RemoveAll(tmpDir)

	targetFile := filepath.Join(tmpDir, "test.flac")
	copyFixture(t, "../../tests/fixtures/test.flac", targetFile)

	updates := tagger.TagUpdates{
		Title:  "Flac Title",
		Artist: "Flac Artist",
		Album:  "Flac Album",
	}

	err = tagger.WriteTags(targetFile, updates)
	require.NoError(t, err)

	tags, err := taglib.ReadTags(targetFile)
	require.NoError(t, err)

	assert.Contains(t, tags["TITLE"], "Flac Title")
	assert.Contains(t, tags["ARTIST"], "Flac Artist")
	assert.Contains(t, tags["ALBUM"], "Flac Album")
}

func TestWriteTags_InvalidFile(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "tagger_invalid_*")
	require.NoError(t, err)
	defer os.RemoveAll(tmpDir)

	invalidFile := filepath.Join(tmpDir, "not_audio.txt")
	err = os.WriteFile(invalidFile, []byte("plain text file"), 0644)
	require.NoError(t, err)

	err = tagger.WriteTags(invalidFile, tagger.TagUpdates{Title: "Fails"})
	assert.Error(t, err)
}
