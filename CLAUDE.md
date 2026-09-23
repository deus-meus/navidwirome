# Navidwirome Developer & Claude Code Guidelines

## 🎵 Project Context
**Navidwirome** is an enhanced, self-hosted music server and streamer forked from [Navidrome](https://github.com/navidrome/navidrome).
Key extensions include:
- Native Web Audio Uploads (single/batch, drag-and-drop).
- Audio Fingerprinting via Chromaprint (`fpcalc`) & AcoustID / MusicBrainz API.
- Built-in ID3 / FLAC Metadata & Tag Editor in Web UI.
- Granular Multi-User Permissions (`can_upload`, `can_edit_tags`).
- Intelligent File Organization & Fast Incremental Library Re-indexing.

Consult [PRD.md](./PRD.md) for full functional specifications, data flows, and architectural diagrams.

---

## 🗣️ Communication & Workflow Discipline
- **Explain Before Coding**: Always explain the root cause analysis (WHY) and proposed solution approach (HOW) clearly in conversational text FIRST. Wait for user confirmation before making file edits or generating final code.
- **Language Convention**: Use Indonesian for interactive chat responses; use English for code, comments, commit messages, and `.md` documentation files.
- **Obsidian Vault Integration**: Automatically document completed feature architectures, database schemas, and major bug fixes in the Obsidian Vault (`~/Documents/ObsidianVaults/DevKnowledge`).

---

## 🛠️ Upstream Fork & Architecture Discipline
- **Modular Isolation**: Keep all new Navidwirome logic (upload handlers, tagger, fingerprinting, organizer) cleanly decoupled in dedicated packages or service submodules. Minimize invasive changes to upstream core files to ensure painless git merges from upstream `navidrome/navidrome`.
- **Subsonic API Purity**: Never break, alter, or introduce breaking regressions into the standard Subsonic/Madsonic REST API endpoints. All third-party client apps (Symfonium, Feishin, Amperfy, DSub) must function seamlessly.
- **Backward Compatibility**: Ensure SQLite database schema migrations are additive and non-destructive.

---

## 🛡️ Defensive Programming & File Safety
- **Path Traversal Protection**: Never trust user-provided metadata (artist, album, filename) when constructing physical disk paths. Always sanitize inputs, strip null bytes, eliminate `..` traversal, and use `filepath.Clean`.
- **Atomic File Operations**: When modifying ID3/FLAC audio tags, always write to a temporary file in the same directory first, verify file integrity, and atomically rename over the original. Never corrupt user audio collections.
- **Graceful Network Fallback**: AcoustID and MusicBrainz lookups must have reasonable timeouts (< 5s) and must fail gracefully back to reading existing tags or filenames if offline or rate-limited.
- **Strict Authorization**: Always enforce `can_upload` and `can_edit_tags` checks on the backend API layer before executing any file system writes.

---

## 💻 Tech Stack & Tooling Commands

### Backend (Go)
- **Language**: Go 1.22+ (Running Go 1.26.x locally)
- **External CLI Tools**: `ffmpeg` (transcoding), `fpcalc` (Chromaprint audio fingerprinting)
- **Run Server**:
  ```bash
  go run main.go --musicfolder="./test_music" --datafolder="./test_data"
  ```
- **Run Tests**:
  ```bash
  go test -v ./...
  ```
- **Code Formatting**:
  ```bash
  gofmt -s -w .
  ```

### Frontend (React Web UI)
- **Directory**: `ui/`
- **Tooling**: Node.js v22+, npm
- **Install Dependencies**:
  ```bash
  cd ui && npm install
  ```
- **Development Server (Hot-Reload)**:
  ```bash
  cd ui && npm start
  ```
- **Production Build**:
  ```bash
  cd ui && npm run build
  ```

---

## 🧪 Testing & Verification
- Verify backend endpoints with targeted unit tests following the **AAA (Arrange, Act, Assert)** pattern.
- Always test file uploads with various formats (`.mp3`, `.flac`, `.m4a`, `.ogg`) and edge-case filenames (special characters, unicode, long titles).
- Verify permissions by simulating both unauthorized (`403 Forbidden`) and authorized calls.
