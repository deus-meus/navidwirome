package fingerprint

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

var (
	ErrNoMatch     = errors.New("no audio fingerprint match found")
	ErrFpcalcError = errors.New("failed to generate audio fingerprint")
)

const DefaultAcoustIDClientKey = "8XaBELgH"
const DefaultAcoustIDURL = "https://api.acoustid.org/v2/lookup"

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
	endpoint string
	apiKey   string
	client   *http.Client
}

func NewClient() *Client {
	return NewClientWithURL(DefaultAcoustIDURL, 5*time.Second)
}

func NewClientWithURL(endpoint string, timeout time.Duration) *Client {
	return &Client{
		endpoint: endpoint,
		apiKey:   DefaultAcoustIDClientKey,
		client:   &http.Client{Timeout: timeout},
	}
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
	params.Set("meta", "recordings+releasegroups+compress")
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
