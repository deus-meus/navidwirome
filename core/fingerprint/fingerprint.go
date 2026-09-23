package fingerprint

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/navidrome/navidrome/conf"
)

var (
	ErrNoMatch     = errors.New("no audio fingerprint match found")
	ErrFpcalcError = errors.New("failed to generate audio fingerprint")
)

const DefaultAcoustIDClientKey = "p23b3SPjlAc"
const DefaultAcoustIDURL = "https://api.acoustid.org/v2/lookup"
const DefaultSearchURL = "https://itunes.apple.com/search"

type TrackMetadata struct {
	Title       string `json:"title"`
	Artist      string `json:"artist"`
	Album       string `json:"album"`
	Year        string `json:"year"`
	Genre       string `json:"genre"`
	TrackNumber string `json:"trackNumber"`
	CoverArtURL string `json:"coverArtURL"`
}

type Client struct {
	endpoint  string
	apiKey    string
	searchURL string
	client    *http.Client
}

func NewClient() *Client {
	key := conf.Server.AcoustID.ClientKey
	if key == "" {
		key = os.Getenv("ND_ACOUSTID_CLIENTKEY")
	}
	if key == "" {
		key = DefaultAcoustIDClientKey
	}
	return NewClientWithURLAndKey(DefaultAcoustIDURL, key, 5*time.Second)
}

func NewClientWithURL(endpoint string, timeout time.Duration) *Client {
	return NewClientWithURLAndKey(endpoint, DefaultAcoustIDClientKey, timeout)
}

func NewClientWithURLAndKey(endpoint, apiKey string, timeout time.Duration) *Client {
	return &Client{
		endpoint:  endpoint,
		apiKey:    apiKey,
		searchURL: DefaultSearchURL,
		client:    &http.Client{Timeout: timeout},
	}
}

func (c *Client) SetSearchURL(url string) {
	c.searchURL = url
}

type acoustIDResponse struct {
	Status  string `json:"status"`
	Results []struct {
		ID         string  `json:"id"`
		Score      float64 `json:"score"`
		Recordings []struct {
			ID      string `json:"id"`
			Title   string `json:"title"`
			Artists []struct {
				Name string `json:"name"`
			} `json:"artists"`
			ReleaseGroups []struct {
				ID    string `json:"id"`
				Title string `json:"title"`
				Type  string `json:"type"`
			} `json:"releasegroups"`
		} `json:"recordings"`
	} `json:"results"`
}

func ParseAcoustIDResponse(data []byte) (*TrackMetadata, error) {
	var resp acoustIDResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, fmt.Errorf("failed to parse AcoustID response: %w", err)
	}

	for _, res := range resp.Results {
		if len(res.Recordings) == 0 {
			continue
		}
		rec := res.Recordings[0]
		meta := &TrackMetadata{
			Title: rec.Title,
		}

		if len(rec.Artists) > 0 {
			meta.Artist = rec.Artists[0].Name
		}

		if len(rec.ReleaseGroups) > 0 {
			rg := rec.ReleaseGroups[0]
			meta.Album = rg.Title
			if rg.ID != "" {
				meta.CoverArtURL = fmt.Sprintf("https://coverartarchive.org/release-group/%s/front", rg.ID)
			}
		}

		return meta, nil
	}

	return nil, ErrNoMatch
}

func (c *Client) LookupFingerprint(ctx context.Context, duration int, fingerprint string) (*TrackMetadata, error) {
	params := url.Values{}
	params.Set("client", c.apiKey)
	params.Set("meta", "recordings releasegroups")
	params.Set("duration", strconv.Itoa(duration))
	params.Set("fingerprint", fingerprint)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, strings.NewReader(params.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AcoustID returned status %d", resp.StatusCode)
	}

	var raw json.RawMessage
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, err
	}

	return ParseAcoustIDResponse(raw)
}

type fpcalcOutput struct {
	Duration    float64 `json:"duration"`
	Fingerprint string  `json:"fingerprint"`
}

// GenerateFingerprint executes fpcalc CLI if available to extract fingerprint and duration.
func GenerateFingerprint(filePath string) (int, string, error) {
	cmd := exec.Command("fpcalc", "-json", filePath)
	out, err := cmd.Output()
	if err != nil {
		return 0, "", fmt.Errorf("%w: %v", ErrFpcalcError, err)
	}

	var fp fpcalcOutput
	if err := json.Unmarshal(out, &fp); err != nil {
		return 0, "", fmt.Errorf("failed to decode fpcalc output: %w", err)
	}

	return int(fp.Duration), fp.Fingerprint, nil
}

// IdentifyFile executes fingerprint generation and external lookup.
func (c *Client) IdentifyFile(ctx context.Context, filePath string) (*TrackMetadata, error) {
	duration, fp, err := GenerateFingerprint(filePath)
	if err != nil {
		return nil, err
	}
	return c.LookupFingerprint(ctx, duration, fp)
}

type itunesSearchResult struct {
	ResultCount int `json:"resultCount"`
	Results     []struct {
		TrackName      string `json:"trackName"`
		ArtistName     string `json:"artistName"`
		CollectionName string `json:"collectionName"`
		ArtworkURL100  string `json:"artworkUrl100"`
	} `json:"results"`
}

// SearchTrack queries iTunes/Apple Music search API to find album name and high-resolution artwork.
func (c *Client) SearchTrack(ctx context.Context, artist, title string) (string, string, error) {
	cleanArtist := strings.TrimSpace(artist)
	cleanTitle := strings.TrimSpace(title)
	if cleanArtist == "" && cleanTitle == "" {
		return "", "", errors.New("empty artist and title for track search")
	}

	searchEndpoint := c.searchURL
	if searchEndpoint == "" {
		searchEndpoint = DefaultSearchURL
	}

	query := strings.TrimSpace(cleanArtist + " " + cleanTitle)
	reqURL := fmt.Sprintf("%s?term=%s&entity=song&limit=1", searchEndpoint, url.QueryEscape(query))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return "", "", err
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("search API returned status %d", resp.StatusCode)
	}

	var searchResp itunesSearchResult
	if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
		return "", "", err
	}

	if len(searchResp.Results) == 0 {
		return "", "", errors.New("no track found")
	}

	res := searchResp.Results[0]
	album := res.CollectionName
	artURL := res.ArtworkURL100
	if artURL != "" {
		artURL = strings.Replace(artURL, "100x100bb", "1000x1000bb", 1)
	}
	return album, artURL, nil
}

// SearchArtworkURL queries iTunes/Apple Music search API to find high-resolution album artwork.
func (c *Client) SearchArtworkURL(ctx context.Context, artist, title string) (string, error) {
	_, artURL, err := c.SearchTrack(ctx, artist, title)
	if err != nil {
		return "", err
	}
	if artURL == "" {
		return "", errors.New("no artwork found")
	}
	return artURL, nil
}

// DownloadCoverArt downloads the cover image from coverURL and writes it as cover.jpg inside targetDir.
func (c *Client) DownloadCoverArt(ctx context.Context, coverURL, targetDir string) error {
	if strings.TrimSpace(coverURL) == "" || strings.TrimSpace(targetDir) == "" {
		return errors.New("coverURL and targetDir must not be empty")
	}

	targetFile := filepath.Join(targetDir, "cover.jpg")
	if _, err := os.Stat(targetFile); err == nil {
		return nil
	}

	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return fmt.Errorf("failed to create directory %s: %w", targetDir, err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, coverURL, nil)
	if err != nil {
		return err
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to download cover art, status: %d", resp.StatusCode)
	}

	tmpFile := filepath.Join(targetDir, "cover.jpg.tmp")
	out, err := os.Create(tmpFile)
	if err != nil {
		return err
	}

	limitReader := io.LimitReader(resp.Body, 10*1024*1024)
	if _, err := io.Copy(out, limitReader); err != nil {
		out.Close()
		_ = os.Remove(tmpFile)
		return err
	}
	out.Close()

	return os.Rename(tmpFile, targetFile)
}
