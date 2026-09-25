package fingerprint_test

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/navidrome/navidrome/core/fingerprint"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseAcoustIDResponse(t *testing.T) {
	sampleJSON := []byte(`{
		"status": "ok",
		"results": [
			{
				"id": "acoust-id-123",
				"score": 0.95,
				"recordings": [
					{
						"id": "mbid-recording-1",
						"title": "Bohemian Rhapsody",
						"artists": [
							{"name": "Queen"}
						],
						"releasegroups": [
							{
								"id": "mbid-releasegroup-1",
								"title": "A Night at the Opera",
								"type": "Album",
								"secondarytypes": []
							}
						]
					}
				]
			}
		]
	}`)

	meta, err := fingerprint.ParseAcoustIDResponse(sampleJSON)
	require.NoError(t, err)
	require.NotNil(t, meta)

	assert.Equal(t, "Bohemian Rhapsody", meta.Title)
	assert.Equal(t, "Queen", meta.Artist)
	assert.Equal(t, "A Night at the Opera", meta.Album)
	assert.Equal(t, "https://coverartarchive.org/release-group/mbid-releasegroup-1/front", meta.CoverArtURL)
}

func TestIdentifyWithMockServer(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{
			"status": "ok",
			"results": [
				{
					"score": 0.9,
					"recordings": [
						{
							"title": "Comfortably Numb",
							"artists": [{"name": "Pink Floyd"}],
							"releasegroups": [{"id": "rg-pink-floyd", "title": "The Wall"}]
						}
					]
				}
			]
		}`))
	}))
	defer ts.Close()

	client := fingerprint.NewClientWithURL(ts.URL, 5*time.Second)
	ctx := context.Background()

	meta, err := client.LookupFingerprint(ctx, 380, "fake-audio-fingerprint-data")
	require.NoError(t, err)
	require.NotNil(t, meta)
	assert.Equal(t, "Comfortably Numb", meta.Title)
	assert.Equal(t, "Pink Floyd", meta.Artist)
	assert.Equal(t, "The Wall", meta.Album)
}

func TestIdentifyTimeout(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(100 * time.Millisecond)
		w.Write([]byte(`{}`))
	}))
	defer ts.Close()

	// 10ms timeout should abort fast
	client := fingerprint.NewClientWithURL(ts.URL, 10*time.Millisecond)
	ctx := context.Background()

	meta, err := client.LookupFingerprint(ctx, 100, "data")
	assert.Error(t, err)
	assert.Nil(t, meta)
}

func TestSearchArtworkURL(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{
			"resultCount": 1,
			"results": [
				{
					"trackName": "Cobra",
					"artistName": "Geese",
					"collectionName": "Getting Killed",
					"artworkUrl100": "https://example.com/image/100x100bb.jpg"
				}
			]
		}`))
	}))
	defer ts.Close()

	client := fingerprint.NewClient()
	client.SetSearchURL(ts.URL)

	url, err := client.SearchArtworkURL(context.Background(), "Geese", "Cobra")
	require.NoError(t, err)
	assert.Equal(t, "https://example.com/image/1000x1000bb.jpg", url)
}

func TestDownloadCoverArt(t *testing.T) {
	expectedData := []byte("fake-jpeg-image-bytes")
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "image/jpeg")
		w.Write(expectedData)
	}))
	defer ts.Close()

	tmpDir := t.TempDir()
	client := fingerprint.NewClient()

	err := client.DownloadCoverArt(context.Background(), ts.URL, tmpDir)
	require.NoError(t, err)

	destFile := filepath.Join(tmpDir, "cover.jpg")
	assert.FileExists(t, destFile)
	data, err := os.ReadFile(destFile)
	require.NoError(t, err)
	assert.Equal(t, expectedData, data)

	// Idempotent test: if cover.jpg already exists, it shouldn't overwrite or error
	err = client.DownloadCoverArt(context.Background(), ts.URL, tmpDir)
	require.NoError(t, err)
}

func TestDownloadCoverArt_UserAgent(t *testing.T) {
	var receivedUserAgent string
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedUserAgent = r.Header.Get("User-Agent")
		w.Header().Set("Content-Type", "image/jpeg")
		w.Write([]byte("fake-jpeg"))
	}))
	defer ts.Close()

	tmpDir := t.TempDir()
	client := fingerprint.NewClient()
	err := client.DownloadCoverArt(context.Background(), ts.URL, tmpDir)
	require.NoError(t, err)
	assert.Contains(t, receivedUserAgent, "Navidwirome")
}

func TestDownloadCoverArtWithFallback_PrimarySucceeds(t *testing.T) {
	primaryCalled := false
	fallbackCalled := false

	primaryServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		primaryCalled = true
		w.Header().Set("Content-Type", "image/jpeg")
		w.Write([]byte("primary-art"))
	}))
	defer primaryServer.Close()

	fallbackImageServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "image/jpeg")
		w.Write([]byte("fallback-art"))
	}))
	defer fallbackImageServer.Close()

	searchServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fallbackCalled = true
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"resultCount":1,"results":[{"collectionName":"Album","artworkUrl100":"%s"}]}`, fallbackImageServer.URL)
	}))
	defer searchServer.Close()

	client := fingerprint.NewClient()
	client.SetSearchURL(searchServer.URL)

	tmpDir := t.TempDir()
	err := client.DownloadCoverArtWithFallback(context.Background(), primaryServer.URL, "Artist", "Song", tmpDir)
	require.NoError(t, err)
	assert.True(t, primaryCalled)
	assert.False(t, fallbackCalled)

	data, err := os.ReadFile(filepath.Join(tmpDir, "cover.jpg"))
	require.NoError(t, err)
	assert.Equal(t, []byte("primary-art"), data)
}

func TestDownloadCoverArtWithFallback_PrimaryFails_FallbackSucceeds(t *testing.T) {
	primaryServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "internal server error", http.StatusInternalServerError)
	}))
	defer primaryServer.Close()

	fallbackImageServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "image/jpeg")
		w.Write([]byte("fallback-art"))
	}))
	defer fallbackImageServer.Close()

	searchServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"resultCount":1,"results":[{"collectionName":"Album","artworkUrl100":"%s"}]}`, fallbackImageServer.URL)
	}))
	defer searchServer.Close()

	client := fingerprint.NewClient()
	client.SetSearchURL(searchServer.URL)

	tmpDir := t.TempDir()
	err := client.DownloadCoverArtWithFallback(context.Background(), primaryServer.URL, "Artist", "Song", tmpDir)
	require.NoError(t, err)

	data, err := os.ReadFile(filepath.Join(tmpDir, "cover.jpg"))
	require.NoError(t, err)
	assert.Equal(t, []byte("fallback-art"), data)
}

func TestDownloadCoverArtNamed(t *testing.T) {
	expectedData := []byte("custom-named-cover-art-bytes")
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "image/jpeg")
		w.Write(expectedData)
	}))
	defer ts.Close()

	tmpDir := t.TempDir()
	client := fingerprint.NewClient()

	customName := "The Beatles - Abbey Road.jpg"
	err := client.DownloadCoverArtNamed(context.Background(), ts.URL, tmpDir, customName)
	require.NoError(t, err)

	destFile := filepath.Join(tmpDir, customName)
	assert.FileExists(t, destFile)
	data, err := os.ReadFile(destFile)
	require.NoError(t, err)
	assert.Equal(t, expectedData, data)
}

func TestDownloadCoverArtWithFallbackNamed(t *testing.T) {
	primaryServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "image/jpeg")
		w.Write([]byte("custom-primary-art"))
	}))
	defer primaryServer.Close()

	tmpDir := t.TempDir()
	client := fingerprint.NewClient()

	customName := "Pink Floyd - Time.jpg"
	err := client.DownloadCoverArtWithFallbackNamed(context.Background(), primaryServer.URL, "Pink Floyd", "Time", tmpDir, customName)
	require.NoError(t, err)

	destFile := filepath.Join(tmpDir, customName)
	assert.FileExists(t, destFile)
	data, err := os.ReadFile(destFile)
	require.NoError(t, err)
	assert.Equal(t, []byte("custom-primary-art"), data)
}

func TestIdentifyRealFile(t *testing.T) {
	testFile := "/home/dwidora/Music/_Inbox/Conundrum.mp3"
	if _, err := os.Stat(testFile); os.IsNotExist(err) {
		t.Skip("sample file not found, skipping live identification test")
	}

	client := fingerprint.NewClient()
	meta, err := client.IdentifyFile(context.Background(), testFile)
	require.NoError(t, err)
	require.NotNil(t, meta)

	assert.Equal(t, "Conundrum", meta.Title)
	assert.Equal(t, "The SIGIT", meta.Artist)
	assert.Equal(t, "Detourn", meta.Album)
	assert.NotEmpty(t, meta.CoverArtURL)
}
