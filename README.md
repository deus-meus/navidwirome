<p align="center">
  <img src="ui-new/public/favicon.svg" alt="Navidwirome Logo" width="80" height="80" />
</p>

# Navidwirome Studio

**Navidwirome** is an enhanced, self-hosted music server and streamer forked from [Navidrome](https://github.com/navidrome/navidrome). It features a modern, responsive **Warm Audiophile Matte UI (`ui-new`)**, native web audio uploads, built-in ID3/FLAC metadata editing, Chromaprint audio fingerprinting, and granular multi-user permissions.

---

## 🌟 Key Features & Extensions

- 🎧 **Warm Audiophile Web UI (`ui-new`)**: Built from the ground up with React 19, Tailwind CSS, and Vite. Includes a **Floating Glass Mini Player**, **Full-Screen Audio Sheet**, edge-to-edge **Mobile Bottom Navigation**, and **Collapsible Dual Sidebars** for iPad & Desktop viewports.
- 📤 **Native Web Audio Uploads**: Drag-and-drop single & batch file uploads directly from the web interface, protected by backend permission gating (`can_upload`).
- 🏷️ **Built-in ID3 / FLAC Metadata Editor**: Integrated web UI tag editor allowing users to modify track tags on disk (`can_edit_tags` permission gated).
- 🔍 **Audio Fingerprinting & Metadata Lookup**: Integrated Chromaprint (`fpcalc`) audio fingerprinting with AcoustID & MusicBrainz API integration.
- 🔐 **Granular Multi-User Permissions**: Fine-grained user controls (`can_upload`, `can_edit_tags`, `isAdmin`).
- 📱 **Full Subsonic API Compatibility**: Seamlessly works with third-party mobile apps including Symfonium, Feishin, Amperfy, and DSub.
- ⚡ **Fast Incremental Library Indexing**: Optimized SQLite storage and media scanning.

---

## 🐳 Quick Start (Docker Compose)

Deploy Navidwirome easily using Docker Compose:

```yaml
version: "3.8"

services:
  navidwirome:
    image: ghcr.io/deus-meus/navidwirome:latest
    container_name: navidwirome
    restart: unless-stopped
    ports:
      - "4533:4533"
    volumes:
      - ./data:/data
      - ./music:/music
    environment:
      - ND_MUSICFOLDER=/music
      - ND_DATAFOLDER=/data
      - ND_PORT=4533
      - ND_SCANSCHEDULE=1h
      - ND_LOGLEVEL=info
```

Run the container:
```bash
docker compose up -d
```

---

## 💻 Tech Stack & Architecture

- **Backend**: Go 1.22+ (SQLite FTS5, Subsonic API, Native Mutators, Chromaprint)
- **Frontend**: React 19, Vite, Tailwind CSS, Zustand, Vitest (`ui-new/`)
- **Containerization**: Docker, GitHub Container Registry (`ghcr.io`), GitHub Actions CI/CD

---

## 🙏 Credits & Acknowledgments

Navidwirome is built upon the incredible open-source foundation of [Navidrome](https://github.com/navidrome/navidrome) created by [Deluan](https://github.com/deluan) and the Navidrome open-source contributors. We extend our sincere gratitude to the original project authors for their dedicated work on the Go backend architecture and Subsonic API integration.

---

## 📜 License

Licensed under the [GNU General Public License v3.0](LICENSE).
