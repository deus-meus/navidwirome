# Product Requirements Document (PRD)
## Project: Navidwirome (Navidrome Fork)

### 1. Overview & Objective
**Navidwirome** is an enhanced, self-hosted modern music server and streamer forked from [Navidrome](https://github.com/navidrome/navidrome). 

While upstream Navidrome strictly enforces a read-only paradigm, Navidwirome transforms the platform into an all-in-one music hub by adding:
1. Native **Web Audio Uploads** (drag-and-drop & batch processing).
2. **Automatic Audio Fingerprinting & Metadata Retrieval** (Chromaprint / AcoustID & MusicBrainz).
3. Built-in **ID3 / FLAC Metadata Editor** directly from the Web UI.
4. **Granular Multi-User Permissions** (`can_upload`, `can_edit_tags`).
5. **Intelligent File Organization** with automatic folder sorting and incremental re-indexing.

All additions preserve 100% backward compatibility with the Subsonic/Madsonic API and existing third-party clients (Symfonium, Feishin, Amperfy, DSub, etc.).

---

### 2. User Personas & Permissions Model
Navidwirome introduces fine-grained Role-Based Access Control (RBAC) extending Navidrome's existing user model:

| Role / Capability | Stream Music & Playlists | Upload New Music (`can_upload`) | Edit Metadata & Tags (`can_edit_tags`) | User & System Management |
| :--- | :---: | :---: | :---: | :---: |
| **Admin** | Yes | Yes (Default: `true`) | Yes (Default: `true`) | Yes |
| **Contributor** | Yes | Yes (`true` granted by Admin) | Yes (`true` granted by Admin) | No |
| **Uploader Only** | Yes | Yes (`true`) | No (`false`) | No |
| **Standard Listener** | Yes | No (`false`) | No (`false`) | No |

---

### 3. Detailed Feature Specifications (Phase 1 - MVP)

#### 3.1. Web Audio Upload Service
- **User Interface**:
  - Dedicated "Upload" action in top navigation / sidebar (rendered conditionally if `user.can_upload == true`).
  - Full Drag-and-Drop dropzone and file picker supporting single or batch audio files.
  - Per-file progress bars, status indicators (Validating -> Fingerprinting -> Saving -> Indexed), and error toasts.
  - Option to toggle "Auto-Tag with AcoustID" on/off prior to upload.
- **Backend & Storage**:
  - `POST /api/music/upload`: Multipart endpoint with authorization & permission checks.
  - Streams incoming payload to a temporary staging directory (`.cache/uploads` or OS temp).
  - Validates file headers via MIME magic bytes to ensure authentic audio payloads.
  - Supported audio formats: MP3, FLAC, M4A/AAC, OGG, Opus, WAV, ALAC.
  - File size limits configurable via environment variables / config file (default: 500MB per file).

#### 3.2. Automatic Audio Fingerprinting & Metadata Engine
- **Fingerprint Generation**:
  - Integration with Chromaprint CLI (`fpcalc`) or Go native bindings to calculate audio waveform fingerprints.
- **AcoustID & MusicBrainz Query**:
  - Submits audio duration and fingerprint hash to AcoustID API.
  - Resolves matching recording to MusicBrainz metadata:
    - Track Title
    - Primary & Featured Artists
    - Album Name & Album Artist
    - Release Date & Year
    - Track Number & Total Tracks
    - Disc Number
    - Primary Genre
    - High-Resolution Cover Artwork (Cover Art Archive)
- **Fallback**:
  - If network is unreachable, API rate limits are hit, or no match is found, fallback gracefully to reading existing internal ID3/Vorbis tags or parsing filename conventions.

#### 3.3. Physical File Organizer Service
- **Target Organization Structure**:
  - Recognized files are atomically moved from staging to:
    ```
    {MusicFolder}/{Artist}/{Album}/{TrackNumber} - {Title}.{ext}
    ```
  - Files with missing/unidentifiable artist or album metadata are moved to:
    ```
    {MusicFolder}/_Inbox/{OriginalFileName}.{ext}
    ```
- **Safety & Sanitization**:
  - Strict path traversal defense: strip and sanitize path separators (`/`, `\`), null bytes, and OS-reserved characters.
  - Atomic rename/move operations across filesystems.
  - Duplicate resolution: prompt user or append increment suffix ` (1).ext` if identical filename exists.
- **Incremental Indexing**:
  - Triggers an isolated, fast scanner run targetting only the newly written directory rather than a full library rescan.

#### 3.4. Built-in ID3 / FLAC Metadata Editor
- **User Interface**:
  - "Edit Metadata" context action in track rows, album views, and player drawers (rendered if `user.can_edit_tags == true`).
  - Modal form allowing editing of:
    - Title, Artist, Album, Album Artist, Year, Genre, Track #, Disc #, Lyrics, and Cover Artwork.
  - "Auto-Detect (AcoustID)" button inside the modal to re-run audio fingerprinting on-demand.
  - Preview diff showing current file tags vs proposed modifications before saving.
- **Backend & Tag Writing**:
  - `PUT /api/music/track/:id/tags`: Endpoint accepting updated metadata payload.
  - Uses an audio tagging library (e.g., ID3v2 for MP3, Vorbis Comments for FLAC/OGG) to write changes directly to physical files.
  - Employs atomic file updates (writes to temporary file, then renames) to prevent file corruption.
  - If Artist or Album title changes, file organizer automatically updates disk folder paths accordingly.
  - Updates Navidrome SQLite database immediately to reflect changes in Web UI and connected Subsonic apps.

#### 3.5. Granular User Management & DB Schema Migration
- **Database Changes (SQLite)**:
  - Add `can_upload` (BOOLEAN, DEFAULT 0 NOT NULL) to `user` table.
  - Add `can_edit_tags` (BOOLEAN, DEFAULT 0 NOT NULL) to `user` table.
  - Migration script ensuring existing Admin accounts are initialized with `1` (true).
- **Admin UI**:
  - User creation and edit dialogs updated with checkboxes for both permissions.

---

### 4. Technical Architecture & Component Layout

```
                  +----------------------------------------------+
                  |         Web UI (React / Material-UI)         |
                  +----------------------------------------------+
                         |                              |
            Upload Flow  |                  Tag Edit    |
                         v                              v
                  +------------------+          +------------------+
                  | /api/music/upload|          |/api/music/tags   |
                  +------------------+          +------------------+
                         |                              |
                         +--------------+---------------+
                                        |
                                        v
                         +------------------------------+
                         | RBAC / Auth Permission Gate  |
                         +------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                      |                      |
                 v                      v                      v
     +--------------------+   +--------------------+   +--------------------+
     | Fingerprint Service|   | Tag Writer Service |   | Organizer Service  |
     | (fpcalc/AcoustID)  |   | (ID3v2 / Vorbis)   |   | (Sanitize & Move)  |
     +--------------------+   +--------------------+   +--------------------+
                 |                      |                      |
                 +----------------------+----------------------+
                                        |
                                        v
                         +------------------------------+
                         | Physical Storage (Music Dir) |
                         +------------------------------+
                                        |
                                        v
                         +------------------------------+
                         | Incremental Scanner & SQLite |
                         +------------------------------+
```

---

### 5. Non-Functional Requirements
- **Performance**:
  - File upload streaming with minimal memory overhead (< 50MB resident memory per active upload worker).
  - Fast fingerprinting (< 3 seconds per track using `fpcalc`).
- **Data Integrity & Security**:
  - Zero tolerance for file corruption (atomic writes).
  - No path traversal vulnerabilities (`filepath.Clean`, strict slugification).
  - Authentication tokens required for all mutation endpoints.
- **Maintainability**:
  - Custom features isolated into clean modular packages (`server/upload`, `server/tagger`, etc.) to facilitate easy git merges with upstream Navidrome releases.

---

### 6. Future Roadmap (Post-MVP)
- **Phase 2**:
  - Multi-Folder / Multi-Library segregation.
  - Bulk Tag Editor (edit entire albums / multiple selected tracks at once).
  - Web-based playlist cover art enhancements.
  - Remote playback coordinator ("Listen Together" / Spotify Connect alternative).
