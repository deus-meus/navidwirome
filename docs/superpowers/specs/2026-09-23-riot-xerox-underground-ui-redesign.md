# Riot Xerox Underground UI Redesign Specification

## 1. Overview & Vision
Navidwirome is adopting the **"Riot Xerox Underground"** aesthetic — a high-voltage, tactile visual system inspired by 1990s Pacific Northwest grunge, Riot Grrrl cut-and-paste fanzines, and Art Chantry gig posters. It completely replaces the corporate, sterilised streaming interface with a raw, mechanical, cassette-tape underground radio station atmosphere while preserving 100% of Navidrome's existing capabilities (streaming, queue management, multi-user permissions, transcode profiles, Subsonic API compatibility, tag editing, and uploads).

---

## 2. Core Visual & Design Tokens

### 2.1 Color Palette
- **Canvas / Newsprint Base (`surface`):** `#fcf9f8` (warm, pulpy newsprint background).
- **Carbon Black (`on-surface` / borders):** `#1c1b1b` (heavy 2px–4px structural offset borders, zero soft grays).
- **Riot Blue (`primary` / interactive):** `#1d4ed8` / `#2563eb` (high-contrast active state and primary buttons).
- **Electric Hazard Yellow (`secondary`):** `#fed01b` (high-visibility tape accents, badges, and highlights).
- **Acid Cyan / Teal (`tertiary`):** `#006577` / `#008096` (format tags, technical metadata, status indicators).
- **Hazard Orange / Red (`error`):** `#ba1a1a` (critical alerts, tape counters, destructive actions).
- **Dark Inverted Carbon (`inverse-surface`):** `#121212` / `#1c1b1b` (solid contrast blocks for headers and ticker tapes).

### 2.2 Typography
- **Display Hero & Heavy Headlines:** `Syne` (Weights: 700, 800) — bold, wide, brutalist letterforms.
- **Section Headers & Body Copy:** `Space Grotesk` (Weights: 400, 700) — utilitarian grotesque sans-serif.
- **Labels, Technical Metadata, & Counters:** `Space Mono` (Weights: 400, 700) — mechanical typewriter monospace.
- Web fonts are imported in `ui/index.html` via Google Fonts.

### 2.3 Geometry & Elevation
- **Roundedness:** Strictly `0px` (`border-radius: 0px`). Every button, card, input, and container features hard, knife-cut orthogonal edges.
- **Hard Drop Shadows (Mechanical Drop-Blocks):**
  - Resting Cards: `3px 3px 0px #1c1b1b`
  - Buttons / Modals: `4px 4px 0px #1c1b1b`
  - Hover Expansion: translates `-2px, -2px` with shadow expanding to `6px 6px 0px #1c1b1b`.
  - Active Press: translates `2px, 2px` with shadow flattening to `0px 0px 0px`.
- **Physical Skew & Rotational Overlays:**
  - Deliberate subtle tilt (`rotate(-1deg)` to `rotate(1.5deg)`) on badges, album cards, and header banners.
  - Faux masking tape overlays rendered as translucent ivory rectangles (`rgba(244, 239, 230, 0.85)`) on card corners.

---

## 3. Structural Component Architecture

### 3.1 Top Bar (`AppBar.jsx`)
- Replaced with **"Typewriter Finder"** header:
  - Monospace prompt `>>` with high-contrast input box (`#ffffff` fill, 2px `#1c1b1b` border, `2px 2px 0px #1c1b1b` drop-shadow).
  - Live audio status badge: `STREAMING FLAC DIRECT` with animated blinking dot.
  - Monospace User Avatar badge and Activity triggers.
  - Optional running marquee ticker: `"LIVE SUBSONIC FLAC /// NO COMMERCIAL RADIO ALLOWED /// XEROX RIPS & REEL-TO-REEL DUBS"`.

### 3.2 Sidebar Navigation (`Menu.jsx`)
- Replaces standard Material-UI sidebar with **"Audiozine Cassette Deck"** column:
  - Header badge: `UNDERGROUND AUDIO REC ●` + `NAVIDROME // V.94 AUDIOZINE RIOT CRATE`.
  - Sub-header: `XEROX RUN IDENTIFIER: CASSETTE-STREAM-DECK #882`.
  - Block Navigation Items (Zero radius, bold uppercase monospace, active state in Riot Blue with drop-shadow):
    - `DISCOVER / VAULT` (`/album`)
    - `MIXTAPES & CASSETTES` (`/playlist`)
    - `BANDS & ARTISTS` (`/artist`)
    - `VINYL / CD CRATES` (`/song`)
    - `LOCAL RADIO FM` (`/radio`)
    - `PLAY QUEUE STASH` (`/queue`)
  - Server Status Box at the bottom: `SERVER STATUS // SUBSONIC ONLINE 99.4% CHUNKED` with warning label `PULL TAPE BEFORE EJECTING`.

### 3.3 Bottom Player Bar (`Player.jsx` & Audio Player Styles)
- Reskinned as an analog **Cassette Tape Deck**:
  - **Left Section:**
    - Cassette shell badge: `TAPE A C-90` with neon yellow bottom accent bar.
    - Track metadata in `Space Grotesk` (Artist) and `Space Mono` (Title, Bitrate, Format).
  - **Center Transport Controls:**
    - Analog tape buttons: Shuffle (`🔀`), Fast Rewind (`⏪`), Main Play/Pause in Riot Blue with Electric Yellow shadow (`▶` / `⏸`), Fast Forward (`⏩`), Repeat (`🔁`).
    - Analog tape progress bar: 12px height, 2px border, electric yellow playhead marker.
    - Timestamps in `Space Mono`.
  - **Right Section:**
    - Mechanical **Tape Counter** box: Red label `TAPE COUNTER` with `#0482` monospace digital readout.
    - Volume slider styled as analog potentiometer fader.

### 3.4 Album Grid & Cards (`AlbumGrid.jsx` / `AlbumCard.jsx`)
- Polaroid & Cassette Box presentation:
  - 3px solid `#1c1b1b` border with `4px 4px 0px #1c1b1b` drop-shadow.
  - Staggered alternating rotation (`-1deg`, `1.5deg`, `-0.5deg`).
  - Faux scotch tape strip placed over top borders.
  - Release Year in colored badge (e.g. Electric Yellow or Riot Blue).
  - Format tag: `WAV / LOSSLESS`, `FLAC STEREO`, `320 KBPS DIRECT`.
  - Hover behavior: straightens to `rotate(0deg)` and expands shadow to `6px 6px 0px #1c1b1b`.

### 3.5 Right Queue Panel ("Now Blasting & Live Setlist")
- `NowPlayingPanel.jsx` / Queue Drawer styled as a **Live Stage Setlist**:
  - Header: `LIVE SETLIST // DECK QUEUE SHOWBOX SEATTLE // OCT 23, 1993`.
  - **Now Blasting Card**: Neon blue background with animated vertical equalizer bars simulating VU meter / frequency bands.
  - Queued songs listed with numbered badges (`02.`, `03.`), duration, and instant skip on click.
  - Quick action buttons: `CLEAR STASH` and `SHUFFLE REEL`.
  - Storage/Cache gauge: `LOCAL CASSETTE CACHE 48.2 GB / 120 GB (40% BUFFERED)` and latency readout.

---

## 4. Technical Implementation Strategy

1. **Theme Engine Integration (`ui/src/themes/riotXerox.js` & `.css.js`):**
   - Register `RiotXeroxTheme` in `ui/src/themes/index.js` as a full first-class theme.
   - Inject fonts, color variables, zero border-radii, and hard drop-shadows via MUI overrides (`overrides.MuiButton`, `overrides.MuiCard`, `overrides.MuiPaper`, `overrides.RaMenuItemLink`).
   - Inject audio player CSS overrides for `.react-jinke-music-player-main`.

2. **Tailwind CSS & Utility Styling in Vite:**
   - Configure Tailwind CSS in `ui/vite.config.js` or via PostCSS to allow modular utility styling inside customized React components.
   - Configure Tailwind design tokens matching `DESIGN.md`.

3. **Incremental Non-Breaking Rollout:**
   - **Phase 1:** Core design tokens, Google Fonts, and theme registration (`RiotXerox`).
   - **Phase 2:** Cassette Player Deck bottom bar reskin.
   - **Phase 3:** Audiozine Sidebar (`Menu.jsx`) & Typewriter Header (`AppBar.jsx`).
   - **Phase 4:** Album Grid & Polaroid Cards with masking tape overlays.
   - **Phase 5:** Live Setlist Queue drawer (`NowPlayingPanel.jsx`).

---

## 5. Backward Compatibility & Stability Guarantees
- No modifications to Subsonic API routes or Go backend handlers.
- All Redux actions (`currentPlaying`, `setPlayMode`, `setVolume`, `syncQueue`) remain intact.
- Multi-user authentication, admin permissions, and library scanning logic operate without disruption.
