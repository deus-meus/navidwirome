package organizer_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/navidrome/navidrome/core/organizer"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSanitizeSegment(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Queen", "Queen"},
		{"AC/DC", "AC_DC"},
		{"../../DotDot", "DotDot"},
		{"..\\Windows\\Path", "Windows_Path"},
		{"Null\x00Byte", "NullByte"},
		{"  Trimmed  ", "Trimmed"},
		{"", "Unknown"},
		{"   ", "Unknown"},
		{"What? Who* <No> : | \"Quote\"", "What_ Who_ _No_ _ _ _Quote_"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			actual := organizer.SanitizeSegment(tt.input)
			assert.Equal(t, tt.expected, actual)
		})
	}
}

func TestResolveTargetPath(t *testing.T) {
	root := "/music"

	t.Run("Standard track with track number", func(t *testing.T) {
		path := organizer.ResolveTargetPath(root, "Queen", "A Night at the Opera", "01", "Bohemian Rhapsody", ".mp3")
		expected := filepath.Join(root, "Queen", "A Night at the Opera", "01 - Bohemian Rhapsody.mp3")
		assert.Equal(t, expected, path)
	})

	t.Run("Track without track number", func(t *testing.T) {
		path := organizer.ResolveTargetPath(root, "Queen", "A Night at the Opera", "", "Bohemian Rhapsody", ".flac")
		expected := filepath.Join(root, "Queen", "A Night at the Opera", "Bohemian Rhapsody.flac")
		assert.Equal(t, expected, path)
	})

	t.Run("Missing artist falls back to _Inbox", func(t *testing.T) {
		path := organizer.ResolveTargetPath(root, "", "Some Album", "01", "Track 1", ".mp3")
		expected := filepath.Join(root, "_Inbox", "Track 1.mp3")
		assert.Equal(t, expected, path)
	})

	t.Run("Missing album falls back to _Inbox", func(t *testing.T) {
		path := organizer.ResolveTargetPath(root, "Some Artist", "", "01", "Track 1", ".mp3")
		expected := filepath.Join(root, "_Inbox", "Track 1.mp3")
		assert.Equal(t, expected, path)
	})
}

func TestMoveFileSafely(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "organizer_test_*")
	require.NoError(t, err)
	defer os.RemoveAll(tmpDir)

	srcFile := filepath.Join(tmpDir, "temp_source.mp3")
	content := []byte("audio dummy content")
	err = os.WriteFile(srcFile, content, 0644)
	require.NoError(t, err)

	dstFile := filepath.Join(tmpDir, "TargetDir", "SubDir", "final.mp3")

	finalPath, err := organizer.MoveFileSafely(srcFile, dstFile)
	require.NoError(t, err)
	assert.Equal(t, dstFile, finalPath)

	// Verify dst exists and has content
	data, err := os.ReadFile(finalPath)
	require.NoError(t, err)
	assert.Equal(t, content, data)

	// Verify src is removed
	_, err = os.Stat(srcFile)
	assert.True(t, os.IsNotExist(err))

	// Test collision handling: moving another file to the same dstFile creates a unique suffix
	srcFile2 := filepath.Join(tmpDir, "temp_source2.mp3")
	err = os.WriteFile(srcFile2, []byte("content 2"), 0644)
	require.NoError(t, err)

	finalPath2, err := organizer.MoveFileSafely(srcFile2, dstFile)
	require.NoError(t, err)
	assert.NotEqual(t, dstFile, finalPath2)
	assert.Contains(t, finalPath2, "final (1).mp3")
}

func TestParseFilenameMetadata(t *testing.T) {
	tests := []struct {
		filename       string
		expectedArtist string
		expectedTitle  string
	}{
		{
			filename:       "Geese - Cobra (Official Audio).mp3",
			expectedArtist: "Geese",
			expectedTitle:  "Cobra",
		},
		{
			filename:       "Queen - Bohemian Rhapsody [Official Video].flac",
			expectedArtist: "Queen",
			expectedTitle:  "Bohemian Rhapsody",
		},
		{
			filename:       "01 - Pink Floyd - Time.mp3",
			expectedArtist: "Pink Floyd",
			expectedTitle:  "Time",
		},
		{
			filename:       "Radiohead - Creep (Lyrics).opus",
			expectedArtist: "Radiohead",
			expectedTitle:  "Creep",
		},
		{
			filename:       "Just ASong Title.wav",
			expectedArtist: "",
			expectedTitle:  "Just ASong Title",
		},
	}

	for _, tt := range tests {
		t.Run(tt.filename, func(t *testing.T) {
			artist, title := organizer.ParseFilenameMetadata(tt.filename)
			assert.Equal(t, tt.expectedArtist, artist)
			assert.Equal(t, tt.expectedTitle, title)
		})
	}
}
