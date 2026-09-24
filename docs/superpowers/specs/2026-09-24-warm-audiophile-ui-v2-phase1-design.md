# Specification: Warm Audiophile Matte UI (v2) - Phase 1

- **Topic**: Greenfield Web UI for Navidwirome (Phase 1: Foundation, Auth, 3-Zone Shell & Audio Engine)
- **Date**: 2026-09-24
- **Author**: Claude Code & dwinarwastu
- **Status**: Approved Design Spec
- **Target Directory**: `ui-v2/`

---

## 1. Executive Summary & Goals

Navidwirome is transitioning from its legacy Web UI (React-Admin v3 / Material-UI v4) to a modern, lightweight, greenfield Single Page Application (SPA) built from scratch.

This redesign completely adopts the **"Warm Audiophile Matte"** design system generated via Google Stitch:
- High-fidelity analog aesthetic inspired by Braun, Dieter Rams, Nagra recorders, and vacuum-tube hardware.
- Dark matte palette: Charcoal canvas (`#131315`), slate containers (`#1b1b1d`), hairline dividers (`#2e2d33`), and warm terracotta/amber accent (`#d97746`).
- Refined typography: `Newsreader` (humanist serif for headlines), `Manrope` (clean modern grotesque for interface & body), and `JetBrains Mono` (monospaced telemetry for bitrates, durations, and audio format badges).
- Standard Material Symbols Outlined icons.

**Scope of Phase 1**:
Phase 1 delivers the operational core of the application:
1. Greenfield project scaffold in `ui-v2/` using Vite + React 19 + Tailwind CSS.
2. Complete Tailwind design token setup matching `DESIGN.md`.
3. Subsonic REST API authentication client with auto-login and session persistence.
4. Core 3-Zone Layout Shell (Left Sidebar, Top Header, Right Drawer for Now Playing/Lyrics, and Bottom Audio Transport Dock).
5. Headless Audio Engine (singleton HTML5 audio manager + Zustand player store) supporting playback, queue management, scrubbing, and volume control.
6. Minimalist Login View.

---

## 2. Tech Stack & Dependencies

| Tool / Library | Version | Purpose |
| :--- | :--- | :--- |
| **Vite** | `^6.0.0` or `^7.0.0` | Next-generation frontend bundler & fast HMR dev server |
| **React & React-DOM** | `^19.0.0` (or `^18.3.1`) | Modern component model, hooks, and clean lifecycle |
| **Tailwind CSS** | `^3.4.0` | Utility-first CSS framework configured with Audiophile Matte tokens |
| **Zustand** | `^4.5.0` or `^5.0.0` | Ultra-lightweight global state management (stores for Auth, Player, UI) |
| **React Router** | `^6.26.0` | Client-side routing (`/`, `/albums`, `/artists`, `/songs`, `/playlists`) |
| **Blueimp MD5** | `^2.19.0` | Subsonic token calculation: `md5(password + salt)` |
| **Vitest & RTL** | `^2.0.0` / `^16.0.0` | Automated unit and integration testing suite |

---

## 3. Project Directory Structure (`ui-v2/`)

```text
ui-v2/
├── index.html                   # HTML template loading Google Fonts & Material Symbols
├── package.json                 # Modern dependencies (React, Vite, Tailwind, Zustand)
├── vite.config.js               # Dev server proxying /rest, /api, /auth to Go backend
├── tailwind.config.js           # Design tokens (colors, typography, radii, spacing)
├── postcss.config.js            # PostCSS configuration for Tailwind
├── src/
│   ├── main.jsx                 # Application entry point
│   ├── App.jsx                  # Main shell and router mount
│   ├── api/
│   │   ├── subsonic.js          # Subsonic API client (ping, streamUrl, coverArt, playlists)
│   │   └── types.js             # Data shape definitions
│   ├── audio/
│   │   └── audioManager.js      # Headless HTML5 Audio controller singleton
│   ├── store/
│   │   ├── useAuthStore.js      # Authentication, user details, credentials, session
│   │   ├── usePlayerStore.js    # Current track, queue, isPlaying, volume, seek time
│   │   └── useUIStore.js        # Sidebar toggle, right drawer open/close
│   ├── components/
│   │   ├── shell/
│   │   │   ├── ShellLayout.jsx  # Fixed 100vh 3-zone container
│   │   │   ├── Sidebar.jsx      # Left navigation (240px): Logo, Search, Menu, Playlists
│   │   │   ├── Header.jsx       # Top action bar: History nav, tabs, audio status badge
│   │   │   ├── PlayerBar.jsx    # Bottom audio transport dock (76px): Controls & scrubber
│   │   │   └── RightPanel.jsx   # Collapsible right panel (320px): Cover, lyrics, metadata
│   │   ├── common/
│   │   │   ├── Artwork.jsx      # Safe Subsonic cover art with fallback vinly placeholder
│   │   │   └── Scrubber.jsx     # Terracotta scrub bar & volume slider
│   │   └── auth/
│   │       └── LoginView.jsx    # Sleek dark matte login form
│   ├── views/
│   │   └── DiscoverView.jsx     # Initial landing dashboard view
│   └── styles/
│       └── index.css            # Tailwind directives, custom scrollbars, base reset
```

---

## 4. Design System Tokens (`tailwind.config.js`)

### Colors
- `background`: `#131315` (Deep matte charcoal canvas)
- `surface-container-lowest`: `#0e0e10` (Recessed areas)
- `surface-container-low`: `#1b1b1d` (Sidebar & Player bar background)
- `surface-container`: `#1f1f22` (Panels & default containers)
- `surface-container-high`: `#242427` (Interactive tiles & card surfaces)
- `surface-container-highest`: `#333237` (Hover states)
- `outline`: `#4a423d`
- `outline-variant`: `#2e2d33` (Hairline slate borders, 1px)
- `primary`: `#d97746` (Warm terracotta/amber accent)
- `primary-bright`: `#f08d5b` (Hover accent)
- `on-surface`: `#f4f3f0` (Primary off-white text)
- `on-surface-variant`: `#a8a5a0` (Secondary text, artists, metadata)
- `on-surface-dim`: `#545663` (Muted labels, disabled text)

### Typography
- `Newsreader`: Headlines, album titles, featured hero banners.
- `Manrope`: Interface labels, song titles, navigation items, body text.
- `JetBrains Mono`: Track duration, timestamps, bitrate (`24-bit/96kHz`), queue indicators.

### Geometry
- `rounded`: `4px` (Buttons, inputs, thumbnails)
- `rounded-lg`: `8px` (Cards, dialogs, quick access tiles)
- `rounded-xl`: `12px` (Hero cards, upload dropzone)
- `rounded-full`: `9999px` (Scrubber thumb, badges, user avatar)

---

## 5. Subsonic API Client & Authentication

### Protocol Specification
All Subsonic requests authenticate via token + salt:
- `u`: Username
- `t`: MD5 hash of `password + salt`
- `s`: Random alphanumeric salt
- `v`: Protocol version (`1.8.0`)
- `c`: Client identifier (`NavidwiromeStudio`)
- `f`: Format (`json`)

### Core Client Methods (`src/api/subsonic.js`)
- `login(serverUrl, username, password)`: Computes salt/token, tests connection via `ping`, and saves session in `localStorage`.
- `logout()`: Clears credentials and resets player state.
- `ping()`: Validates token validity.
- `getStreamUrl(songId)`: Returns authenticated stream URL: `/rest/stream?id={songId}&...`.
- `getCoverArtUrl(record, size, square)`: Defensively parses artwork prefix:
  - MediaFile: `mf-{id}`
  - Album: `al-{id}`
  - Artist: `ar-{id}`
  - Playlist: `pl-{id}`
- `getPlaylists()`: Fetches user-created playlists from `/rest/getPlaylists`.
- `getAlbumList2(type, size)`: Fetches albums (`recent`, `frequent`, `starred`, `random`).

---

## 6. Audio Engine Architecture

### Singleton Pattern (`src/audio/audioManager.js`)
To decouple playback from React component render lifecycles:
1. A single `HTMLAudioElement` is initialized outside React.
2. Connects to `AudioContext` with an `AnalyserNode` ready for real-time frequency analysis.
3. Event listeners dispatch state updates to `usePlayerStore`:
   - `timeupdate` updates `currentTime`.
   - `durationchange` updates `duration`.
   - `ended` invokes `playNext()`.
   - `error` triggers graceful fallback / error reporting.

### Player Store Actions (`usePlayerStore`)
- `setQueue(tracks, startIndex)`: Loads an array of songs and plays `tracks[startIndex]`.
- `togglePlay()`: Toggles play/pause on `audioManager`.
- `seek(seconds)`: Updates `audio.currentTime`.
- `setVolume(volume)`: Sets `audio.volume` (clamped 0 to 1).
- `playNext()`: Advances `queueIndex` or handles repeat/shuffle modes.
- `playPrev()`: Returns to start of track if `currentTime > 3s`, otherwise goes to previous track.

---

## 7. 3-Zone Layout Shell

### Viewport Layout
- **Fixed Height**: Exactly `100vh` with `overflow: hidden` on viewport.
- **Left Sidebar**: Fixed width `240px`, pinned left, `top: 0`, `bottom: 76px`.
- **Top Header**: Fixed height `64px`, pinned `left: 240px`, `right: 0` (or `right: 320px` when panel is open).
- **Central Stage**: Fluid scrollable container `overflow-y: auto`, padding: `24px` to `32px`.
- **Right Panel**: Fixed width `320px`, collapsible via state toggle. Contains large artwork, synchronized lyrics container, and audio format telemetry.
- **Bottom Player Bar**: Fixed height `76px`, pinned across full viewport width `bottom: 0`, `z-index: 50`.

---

## 8. Error Handling & Edge Cases

1. **Network Interruption**:
   - If audio buffering stalls, display a subtle spinner inside the play button.
   - If stream fails completely, toast an error and advance to the next playable track.
2. **Missing Artwork**:
   - `<Artwork />` handles HTTP 404 or missing IDs by rendering an elegant SVG vinyl record silhouette with dark matte styling.
3. **Session Expiry**:
   - When Subsonic responds with Error 40 (Wrong username/password) or token invalidation, automatically clear session and show `LoginView`.
4. **Volume Persistence**:
   - Volume changes persist in `localStorage` and initialize safely on startup.

---

## 9. Verification & Acceptance Criteria

1. **Scaffold Build**: `ui-v2/` compiles cleanly with `npm run build` using Vite.
2. **Design Fidelity**: Colors, fonts (Newsreader, Manrope, JetBrains Mono), and spacing visually match Stitch `screen.png`.
3. **Authentication**: Successful login against local Navidwirome backend (`http://localhost:45330` or configured port) with auto-login on browser refresh.
4. **Playback Execution**: Clicking a track in the player or queue plays audio cleanly through the speakers without clipping or UI freezes.
5. **Transport Control**: Play/Pause, Seek scrubber, and Volume slider respond smoothly and update state in real-time.
6. **Shell Ergonomics**: Collapsing/expanding the right panel smoothly shifts the main stage without horizontal scrollbars.
