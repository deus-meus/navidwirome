# Navidwirome MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Navidrome into an all-in-one music server with native Web Audio Uploads, AcoustID & MusicBrainz Audio Fingerprinting, Built-in ID3/FLAC Tag Editing, and Granular Multi-User Permissions.

**Architecture:** Extend SQLite database with user permission flags, create isolated Go service modules (`core/organizer`, `core/fingerprint`, `core/tagger`), add REST endpoints under `/api/music/*` with selective folder re-indexing via `scanner.ScanFolders`, and build React Web UI uploader and tag editor components.

**Tech Stack:** Go 1.22+, SQLite, TagLib (`go.senan.xyz/taglib`), Chromaprint `fpcalc` CLI, MusicBrainz API, React 17, Material-UI, Vite.

**Spec:** `PRD.md`

## Global Constraints

- Never break or modify Subsonic / Madsonic API endpoints (`/rest/*`).
- Always validate audio files via MIME magic bytes before processing.
- Prevent directory traversal by sanitizing all metadata inputs using `filepath.Clean` and stripping path separators (`/`, `\`, null bytes).
- All physical file tag updates must use atomic writes (write to temp file, then rename).
- Audio fingerprinting and external API lookups must have a 5-second timeout and gracefully fall back to local tags/filename if unreachable.
- Every API mutation endpoint must strictly enforce `can_upload` or `can_edit_tags` permissions.

## Review Focus

1. Uploading a file with `../` or special characters in the ID3 tag metadata attempts path traversal; system must sanitize to safe path under `MusicFolder`.
2. Audio fingerprint API (AcoustID/MusicBrainz) times out or returns HTTP 500; system must gracefully fallback to internal tags or inbox without crashing or dropping upload.
3. Power loss or server crash during tag editing on a FLAC/MP3 file; atomic write ensures original file is never corrupted.
4. Non-admin user without `can_upload` attempts to POST to `/api/music/upload`; server rejects with `403 Forbidden`.
5. Non-admin user without `can_edit_tags` attempts to PUT to `/api/music/track/:id/tags`; server rejects with `403 Forbidden`.

---

### Task 1: Database Migration & User Permissions Model

**Files:**
- Create: `db/migrations/20260923010101_add_user_upload_and_tag_permissions.go`
- Modify: `model/user.go`
- Modify: `model/user_test.go`

**Interfaces:**
- Produces: `model.User.CanUpload`, `model.User.CanEditTags`, `model.User.AllowedToUpload() bool`, `model.User.AllowedToEditTags() bool`

- [ ] **Step 1: Write unit tests for User permission methods**

In `model/user_test.go`, add tests for `AllowedToUpload()` and `AllowedToEditTags()`:
```go
func TestUser_Permissions(t *testing.T) {
	admin := User{IsAdmin: true, CanUpload: false, CanEditTags: false}
	assert.True(t, admin.AllowedToUpload())
	assert.True(t, admin.AllowedToEditTags())

	uploader := User{IsAdmin: false, CanUpload: true, CanEditTags: false}
	assert.True(t, uploader.AllowedToUpload())
	assert.False(t, uploader.AllowedToEditTags())

	editor := User{IsAdmin: false, CanUpload: false, CanEditTags: true}
	assert.False(t, editor.AllowedToUpload())
	assert.True(t, editor.AllowedToEditTags())

	standard := User{IsAdmin: false, CanUpload: false, CanEditTags: false}
	assert.False(t, standard.AllowedToUpload())
	assert.False(t, standard.AllowedToEditTags())
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test -v ./model -run TestUser_Permissions`
Expected: Compilation failure (fields and methods undefined).

- [ ] **Step 3: Update `model/user.go` and create database migration**

Update `model/user.go`:
```go
CanUpload   bool `structs:"can_upload" json:"canUpload"`
CanEditTags bool `structs:"can_edit_tags" json:"canEditTags"`

func (u User) AllowedToUpload() bool {
	return u.IsAdmin || u.CanUpload
}

func (u User) AllowedToEditTags() bool {
	return u.IsAdmin || u.CanEditTags
}
```

Create `db/migrations/20260923010101_add_user_upload_and_tag_permissions.go`:
```go
package migrations

import (
	"database/sql"
	"github.com/pressly/goose/v3"
)

func init() {
	goose.AddMigration(upAddUserUploadAndTagPermissions, downAddUserUploadAndTagPermissions)
}

func upAddUserUploadAndTagPermissions(tx *sql.Tx) error {
	queries := []string{
		`ALTER TABLE user ADD COLUMN can_upload BOOLEAN NOT NULL DEFAULT 0;`,
		`ALTER TABLE user ADD COLUMN can_edit_tags BOOLEAN NOT NULL DEFAULT 0;`,
		`UPDATE user SET can_upload = 1, can_edit_tags = 1 WHERE is_admin = 1;`,
	}
	for _, q := range queries {
		if _, err := tx.Exec(q); err != nil {
			return err
		}
	}
	return nil
}

func downAddUserUploadAndTagPermissions(tx *sql.Tx) error {
	return nil
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test -v ./model -run TestUser_Permissions`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add model/user.go model/user_test.go db/migrations/20260923010101_add_user_upload_and_tag_permissions.go
git commit -m "feat(user): add can_upload and can_edit_tags permissions to user model and db migration"
```

---

### Task 2: Physical File Organizer & Path Sanitizer Service

**Files:**
- Create: `core/organizer/organizer.go`
- Create: `core/organizer/organizer_test.go`

**Interfaces:**
- Produces: 
  - `SanitizeSegment(name string) string`
  - `ResolveTargetPath(musicFolder, artist, album, trackNum, title, ext string) string`
  - `MoveFileSafely(src, dst string) error`

- [ ] **Step 1: Write failing unit tests for File Organizer & Path Sanitizer**

In `core/organizer/organizer_test.go`:
```go
package organizer_test

import (
	"path/filepath"
	"testing"
	"github.com/navidrome/navidrome/core/organizer"
	"github.com/stretchr/testify/assert"
)

func TestSanitizeSegment(t *testing.T) {
	assert.Equal(t, "Queen", organizer.SanitizeSegment("Queen"))
	assert.Equal(t, "AC_DC", organizer.SanitizeSegment("AC/DC"))
	assert.Equal(t, "DotDot", organizer.SanitizeSegment("../../DotDot"))
	assert.Equal(t, "Unknown", organizer.SanitizeSegment("   "))
}

func TestResolveTargetPath(t *testing.T) {
	root := "/music"
	path := organizer.ResolveTargetPath(root, "Queen", "A Night at the Opera", "01", "Bohemian Rhapsody", ".mp3")
	expected := filepath.Join(root, "Queen", "A Night at the Opera", "01 - Bohemian Rhapsody.mp3")
	assert.Equal(t, expected, path)

	inbox := organizer.ResolveTargetPath(root, "", "", "", "test", ".flac")
	expectedInbox := filepath.Join(root, "_Inbox", "test.flac")
	assert.Equal(t, expectedInbox, inbox)
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test -v ./core/organizer`
Expected: FAIL (package does not exist).

- [ ] **Step 3: Implement `core/organizer/organizer.go`**

Implement path sanitization, folder resolution, directory creation, and atomic file move with duplicate avoidance.

- [ ] **Step 4: Run test to verify it passes**

Run: `go test -v ./core/organizer`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add core/organizer/
git commit -m "feat(organizer): implement path sanitizer and file destination resolver"
```

---

### Task 3: Audio Fingerprinting Engine (Chromaprint `fpcalc` + AcoustID / MusicBrainz)

**Files:**
- Create: `core/fingerprint/fingerprint.go`
- Create: `core/fingerprint/fingerprint_test.go`

**Interfaces:**
- Produces:
  - `type TrackMetadata struct { Title, Artist, Album, Year, Genre, TrackNumber, CoverArtURL string }`
  - `type Fingerprinter interface { IdentifyAudio(ctx context.Context, filePath string) (*TrackMetadata, error) }`

- [ ] **Step 1: Write failing unit test with mock HTTP response**

Test AcoustID parsing and MusicBrainz metadata conversion with a mock HTTP server.

- [ ] **Step 2: Run test to verify it fails**

Run: `go test -v ./core/fingerprint`
Expected: FAIL (package does not exist).

- [ ] **Step 3: Implement `core/fingerprint/fingerprint.go`**

Implement `fpcalc` invocation (if present), AcoustID API call, MusicBrainz JSON response unmarshaling, and graceful fallback when offline.

- [ ] **Step 4: Run test to verify it passes**

Run: `go test -v ./core/fingerprint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add core/fingerprint/
git commit -m "feat(fingerprint): implement AcoustID and MusicBrainz audio identifier"
```

---

### Task 4: Audio Metadata & Tag Writer Service

**Files:**
- Create: `core/tagger/tagger.go`
- Create: `core/tagger/tagger_test.go`

**Interfaces:**
- Produces:
  - `type TagUpdates struct { Title, Artist, Album, Year, Genre, TrackNumber string }`
  - `WriteTags(filePath string, tags TagUpdates) error`

- [ ] **Step 1: Write failing unit test for TagWriter**

Test writing tags to a real test audio fixture and reading back to assert matching values.

- [ ] **Step 2: Run test to verify it fails**

Run: `go test -v ./core/tagger`
Expected: FAIL (package does not exist).

- [ ] **Step 3: Implement `core/tagger/tagger.go`**

Implement TagLib tag writing with atomic temp file swap to guarantee zero file corruption.

- [ ] **Step 4: Run test to verify it passes**

Run: `go test -v ./core/tagger`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add core/tagger/
git commit -m "feat(tagger): implement atomic audio tag writer using taglib"
```

---

### Task 5: Native API Mutation Endpoints (`/api/music/*`) & Selective Re-index

**Files:**
- Create: `server/nativeapi/music_mutation.go`
- Create: `server/nativeapi/music_mutation_test.go`
- Modify: `server/nativeapi/native_api.go`

**Interfaces:**
- Produces:
  - `POST /api/music/upload`: multipart upload, streams to staging, parses tags/fingerprint, moves to target folder, triggers `scanner.ScanFolders`.
  - `POST /api/music/identify`: returns suggested metadata for audio file.
  - `PUT /api/music/track/:id/tags`: updates tags, moves file if Artist/Album renamed, updates DB & triggers selective folder scan.

- [ ] **Step 1: Write failing HTTP integration tests for `/api/music/upload` and `/api/music/track/:id/tags`**

Test permissions (403 for unauthorized users, 200/201 for authorized users) and selective scan invocation.

- [ ] **Step 2: Run test to verify it fails**

Run: `go test -v ./server/nativeapi -run TestMusicMutation`
Expected: FAIL

- [ ] **Step 3: Implement `server/nativeapi/music_mutation.go` and register routes**

Hook routes in `native_api.go` under protected group with `can_upload` and `can_edit_tags` checks.

- [ ] **Step 4: Run test to verify it passes**

Run: `go test -v ./server/nativeapi -run TestMusicMutation`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/nativeapi/music_mutation.go server/nativeapi/music_mutation_test.go server/nativeapi/native_api.go
git commit -m "feat(api): add music upload, auto-identification, and tag editing endpoints"
```

---

### Task 6: Frontend User Management Permissions UI

**Files:**
- Modify: `ui/src/user/UserEdit.jsx` (and/or `ui/src/user/UserCreate.jsx`)
- Modify: `ui/src/user/UserList.jsx`

- [ ] **Step 1: Write frontend test for UserEdit permission checkboxes**
- [ ] **Step 2: Run Vitest in `ui/` to verify failure**
- [ ] **Step 3: Add `canUpload` and `canEditTags` Boolean inputs to User forms**
- [ ] **Step 4: Run Vitest to verify pass**
- [ ] **Step 5: Commit**

```bash
git add ui/src/user/
git commit -m "feat(ui): add canUpload and canEditTags checkboxes to user management"
```

---

### Task 7: Frontend Drag-and-Drop Audio Uploader Component

**Files:**
- Create: `ui/src/upload/UploaderDialog.jsx`
- Modify: `ui/src/layout/Header.jsx` (or Sidebar)
- Modify: `ui/src/i18n/en.json`

- [ ] **Step 1: Write test for Uploader button visibility based on `canUpload` permission**
- [ ] **Step 2: Run Vitest to verify failure**
- [ ] **Step 3: Implement `UploaderDialog.jsx` with dropzone, progress bars, and AcoustID toggle**
- [ ] **Step 4: Run Vitest to verify pass**
- [ ] **Step 5: Commit**

```bash
git add ui/src/upload/ ui/src/layout/ ui/src/i18n/
git commit -m "feat(ui): add drag-and-drop audio uploader dialog"
```

---

### Task 8: Frontend ID3/FLAC Tag Editor Modal Component

**Files:**
- Create: `ui/src/song/TagEditorDialog.jsx`
- Modify: `ui/src/song/SongList.jsx` (add "Edit Metadata" context action)
- Modify: `ui/src/i18n/en.json`

- [ ] **Step 1: Write test for "Edit Metadata" action visibility based on `canEditTags`**
- [ ] **Step 2: Run Vitest to verify failure**
- [ ] **Step 3: Implement `TagEditorDialog.jsx` with form inputs and "Auto-Detect" button**
- [ ] **Step 4: Run Vitest to verify pass**
- [ ] **Step 5: Commit**

```bash
git add ui/src/song/ ui/src/i18n/
git commit -m "feat(ui): add tag editor dialog with auto-detect button"
```

---

### Task 9: Full End-to-End Verification & Documentation Update

- [ ] **Step 1: Run complete Go test suite**
Run: `go test -v ./...`
Expected: ALL PASS

- [ ] **Step 2: Run complete Frontend test & type-check suite**
Run: `cd ui && npm run type-check && npm run test`
Expected: ALL PASS

- [ ] **Step 3: Update documentation in Obsidian Vault upon feature completion**
Document schemas and endpoints in `~/Documents/ObsidianVaults/DevKnowledge/navidwirome-system-architecture.md`.

- [ ] **Step 4: Final commit**
```bash
git commit -m "chore: complete MVP implementation of upload, auto-tagging, and tag editor"
```
