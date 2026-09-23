# Riot Xerox Underground UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Navidwirome's web frontend into the high-voltage "Riot Xerox Underground" 90s grunge cassette punk zine aesthetic while preserving 100% of existing media streaming, queue management, permissions, and tag editing functionality.

**Architecture:** Implement the visual design system directly into Navidrome's existing React 17 + Vite + Material-UI v4 frontend via a dedicated first-class theme (`RiotXerox`), custom CSS stylesheet injection (`riotXerox.css.js`), Google Web Fonts, and modular React layout enhancements (Cassette Player Deck, Typewriter Search Header, Audiozine Sidebar, and Polaroid Album Grid).

**Tech Stack:** React 17, Vite, Material-UI v4, React-Admin v3, Google Fonts (`Syne`, `Space Grotesk`, `Space Mono`), Redux, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-23-riot-xerox-underground-ui-redesign.md`

## Global Constraints
- **Zero Border Radius:** Strictly enforce `border-radius: 0px` across buttons, cards, dialogs, inputs, and badges.
- **Hard Drop-Block Shadows:** Surfaces use solid `#1c1b1b` shadows with 0px blur (`3px 3px 0px #1c1b1b` for cards, `4px 4px 0px #1c1b1b` for buttons).
- **Exact Color Palette:**
  - Base Paper: `#fcf9f8`
  - Carbon Black: `#1c1b1b`
  - Riot Blue: `#1d4ed8` / `#2563eb`
  - Electric Hazard Yellow: `#fed01b`
  - Acid Cyan / Teal: `#006577`
  - Hazard Red: `#ba1a1a`
- **Typography Scale:**
  - Display / Headlines: `Syne`, 700/800
  - Body / Subtitles: `Space Grotesk`, 400/700
  - Metadata / Microcopy / Counters: `Space Mono`, 400/700
- **Zero Breaking Changes:** Subsonic API endpoints, Redux state, playback triggers, and permissions remain completely untouched.

## Review Focus
1. **Unidentified / Missing Cover Art:** Empty albums must render a raw brutalist cassette shell icon rather than a broken image or misaligned card.
2. **Long Text Truncation in Player:** Extra-long track titles and artist names in the cassette player bar must truncate cleanly without pushing transport buttons off-screen.
3. **Empty Play Queue Handling:** When queue is empty, the player bar and live setlist panel must display an empty cassette prompt without throwing errors or NaN duration.
4. **Mobile & Small Screen Layout:** On screens < 768px, rotation tilts are subdued (`0deg`) to prevent unwanted horizontal overflow and clipped tap targets.
5. **Theme Switching Hygiene:** Switching themes (e.g. from Riot Xerox to Dark or Light) must cleanly remove or override `#nd-player-style-override` without style leaks.

---

### Task 1: Web Fonts & Riot Xerox Underground Theme Registration

**Files:**
- Modify: `ui/index.html:1-35`
- Create: `ui/src/themes/riotXerox.css.js`
- Create: `ui/src/themes/riotXerox.js`
- Modify: `ui/src/themes/index.js:1-60`
- Test: `ui/src/themes/theme.test.js`

**Interfaces:**
- Produces: `themes.RiotXeroxTheme` exported in `ui/src/themes/index.js`
- Consumes: Google Fonts (`Syne`, `Space Grotesk`, `Space Mono`) loaded in `ui/index.html`

- [ ] **Step 1: Write the failing unit test for Riot Xerox Theme**

In `ui/src/themes/theme.test.js`, add tests verifying that `RiotXeroxTheme` is exported, has `themeName: 'Riot Xerox'`, uses font family `Space Grotesk`, defines zero border radii on buttons, and specifies carbon black palette:

```javascript
it('exports RiotXeroxTheme with proper 90s underground design tokens', () => {
  const { RiotXeroxTheme } = themes
  expect(RiotXeroxTheme).toBeDefined()
  expect(RiotXeroxTheme.themeName).toBe('Riot Xerox')
  expect(RiotXeroxTheme.typography.fontFamily).toContain('Space Grotesk')
  expect(RiotXeroxTheme.overrides.MuiButton.root.borderRadius).toBe(0)
  expect(RiotXeroxTheme.palette.primary.main).toBe('#1d4ed8')
  expect(RiotXeroxTheme.palette.background.default).toBe('#fcf9f8')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/dwidora/Projects/My/navidwirome/ui && npx vitest run src/themes/theme.test.js`
Expected: FAIL (`RiotXeroxTheme` is undefined)

- [ ] **Step 3: Import Google Fonts in `ui/index.html`**

Add Google Fonts links for `Syne`, `Space Grotesk`, and `Space Mono` inside `<head>` of `ui/index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@700;800&display=swap" rel="stylesheet">
```

- [ ] **Step 4: Create `ui/src/themes/riotXerox.css.js` & `ui/src/themes/riotXerox.js`**

Implement `riotXerox.css.js` containing cassette player styling and mechanical borders:
```javascript
const stylesheet = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@700;800&display=swap');

/* Brutalist Mechanical Audio Player */
.react-jinke-music-player-main {
  font-family: 'Space Mono', monospace !important;
}

.react-jinke-music-player-main .music-player-panel {
  background-color: #121212 !important;
  color: #fcf9f8 !important;
  border-top: 4px solid #1c1b1b !important;
  box-shadow: 0 -4px 0px #1c1b1b !important;
}

.react-jinke-music-player-main .music-player-panel .panel-content .rc-slider-track {
  background-color: #1d4ed8 !important;
}

.react-jinke-music-player-main .music-player-panel .panel-content .rc-slider-handle {
  background-color: #fed01b !important;
  border: 2px solid #1c1b1b !important;
  border-radius: 0px !important;
  width: 14px !important;
  height: 18px !important;
}

.react-jinke-music-player-main .play-btn {
  background-color: #1d4ed8 !important;
  box-shadow: 2px 2px 0px #fed01b !important;
  border: 2px solid #fcf9f8 !important;
  border-radius: 0px !important;
}

.react-jinke-music-player-main .play-btn svg {
  color: #ffffff !important;
}

.react-jinke-music-player-main svg:hover {
  color: #fed01b !important;
}
`

export default stylesheet
```

Implement `riotXerox.js` with zero radii, carbon borders, and typography:
```javascript
import stylesheet from './riotXerox.css.js'

const colors = {
  paper: '#fcf9f8',
  black: '#1c1b1b',
  blue: '#1d4ed8',
  yellow: '#fed01b',
  cyan: '#006577',
  red: '#ba1a1a',
  white: '#ffffff',
}

export default {
  themeName: 'Riot Xerox',
  typography: {
    fontFamily: "'Space Grotesk', -apple-system, sans-serif",
    h1: { fontFamily: "'Syne', sans-serif", fontWeight: 800 },
    h2: { fontFamily: "'Syne', sans-serif", fontWeight: 800 },
    h3: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
    h5: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
    h6: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
    body1: { fontFamily: "'Space Grotesk', sans-serif" },
    body2: { fontFamily: "'Space Grotesk', sans-serif" },
    button: { fontFamily: "'Space Mono', monospace", fontWeight: 700 },
    caption: { fontFamily: "'Space Mono', monospace" },
  },
  palette: {
    primary: {
      main: colors.blue,
      contrastText: colors.white,
    },
    secondary: {
      main: colors.yellow,
      contrastText: colors.black,
    },
    background: {
      default: colors.paper,
      paper: colors.paper,
    },
    text: {
      primary: colors.black,
      secondary: '#3b4957',
    },
    type: 'light',
  },
  overrides: {
    MuiButton: {
      root: {
        borderRadius: 0,
        textTransform: 'uppercase',
        border: `2px solid ${colors.black}`,
        boxShadow: `3px 3px 0px ${colors.black}`,
        fontWeight: 'bold',
        '&:hover': {
          transform: 'translate(-1px, -1px)',
          boxShadow: `4px 4px 0px ${colors.black}`,
        },
      },
      containedPrimary: {
        backgroundColor: colors.blue,
        color: colors.white,
        '&:hover': {
          backgroundColor: '#1e40af',
        },
      },
    },
    MuiCard: {
      root: {
        borderRadius: 0,
        border: `2px solid ${colors.black}`,
        boxShadow: `3px 3px 0px ${colors.black}`,
        backgroundColor: colors.paper,
      },
    },
    MuiPaper: {
      rounded: {
        borderRadius: 0,
      },
      elevation1: {
        boxShadow: `3px 3px 0px ${colors.black}`,
        border: `2px solid ${colors.black}`,
      },
    },
    MuiInputBase: {
      root: {
        borderRadius: 0,
        border: `2px solid ${colors.black}`,
        backgroundColor: colors.white,
        fontFamily: "'Space Mono', monospace",
      },
    },
  },
  player: {
    theme: 'dark',
    stylesheet,
  },
}
```

Register `RiotXeroxTheme` in `ui/src/themes/index.js` and set as default or selectable option.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /home/dwidora/Projects/My/navidwirome/ui && npx vitest run src/themes/theme.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add ui/index.html ui/src/themes/
git commit -m "feat(ui): add Riot Xerox Underground theme and typography"
```

---

### Task 2: Analog Cassette Tape Deck Bottom Player Bar

**Files:**
- Modify: `ui/src/audioplayer/styles.js:1-120`
- Modify: `ui/src/audioplayer/AudioTitle.jsx:1-70`
- Modify: `ui/src/audioplayer/PlayerToolbar.jsx:1-80`
- Test: `ui/src/audioplayer/AudioTitle.test.jsx`
- Test: `ui/src/audioplayer/PlayerToolbar.test.jsx`

**Interfaces:**
- Produces: Reskinned cassette tape playback presentation in `AudioTitle.jsx` and `PlayerToolbar.jsx`
- Consumes: Redux `player` state (`currentTrack`, `bitrate`, `codec`, `duration`, `position`)

- [ ] **Step 1: Write failing test for Cassette Badge in `AudioTitle.test.jsx`**

Update `AudioTitle.test.jsx` to test that when active, it renders the `TAPE A C-90` cassette indicator badge and technical bitrate information in monospace:

```javascript
it('renders cassette tape badge and monospace audio specs', () => {
  const track = { title: 'Smells Like Teen Spirit', artist: 'Nirvana', suffix: 'flac', bitRate: 1411 }
  render(<AudioTitle track={track} />)
  expect(screen.getByText(/TAPE A/i)).toBeInTheDocument()
  expect(screen.getByText(/C-90/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/dwidora/Projects/My/navidwirome/ui && npx vitest run src/audioplayer/AudioTitle.test.jsx`
Expected: FAIL

- [ ] **Step 3: Update `AudioTitle.jsx` with Cassette Deck Badge**

Enhance `AudioTitle.jsx` to render the cassette shell indicator (`TAPE A C-90`), title, artist, and format/bitrate badge with retro monospace styling:

```jsx
<div className="cassette-title-container">
  <div className="cassette-shell-badge">
    <span className="tape-label">TAPE A</span>
    <span className="tape-type">C-90</span>
  </div>
  <div className="cassette-track-info">
    <span className="cassette-track-artist">{artist}</span>
    <span className="cassette-track-title">{title}</span>
    <span className="cassette-track-specs">{bitRate ? `BITRATE: ${bitRate} KBPS / ${suffix?.toUpperCase()}` : ''}</span>
  </div>
</div>
```

- [ ] **Step 4: Update `PlayerToolbar.jsx` with Tape Counter Readout**

Add the mechanical `#0482` tape counter box to the player toolbar right section, styled with red label and digital counter:

```jsx
<div className="tape-counter-box">
  <span className="tape-counter-label">TAPE COUNTER</span>
  <span className="tape-counter-digits">#{String(Math.floor(currentTime || 0)).padStart(4, '0')}</span>
</div>
```

- [ ] **Step 5: Run player tests to verify they pass**

Run: `cd /home/dwidora/Projects/My/navidwirome/ui && npx vitest run src/audioplayer/AudioTitle.test.jsx src/audioplayer/PlayerToolbar.test.jsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add ui/src/audioplayer/
git commit -m "feat(ui): reskin bottom audio player as analog cassette deck"
```

---

### Task 3: Typewriter Finder Top Header (`AppBar.jsx`) & Running Ticker

**Files:**
- Modify: `ui/src/layout/AppBar.jsx:1-175`
- Test: `ui/src/layout/AppBar.test.jsx`

**Interfaces:**
- Produces: High-contrast typewriter search bar and live streaming audio badge in `AppBar.jsx`
- Consumes: User authentication state and global search triggers

- [ ] **Step 1: Write failing test in `AppBar.test.jsx`**

Verify that `AppBar` renders the `TYPEWRITER FINDER` prompt and `STREAMING FLAC DIRECT` indicator badge:

```javascript
it('renders Typewriter Finder prompt and streaming status badge', () => {
  renderWithRedux(<AppBar />)
  expect(screen.getByText(/TYPEWRITER FINDER/i)).toBeInTheDocument()
  expect(screen.getByText(/STREAMING FLAC DIRECT/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/dwidora/Projects/My/navidwirome/ui && npx vitest run src/layout/AppBar.test.jsx`
Expected: FAIL

- [ ] **Step 3: Implement Typewriter Search Header in `AppBar.jsx`**

Update `AppBar.jsx` to render:
1. `TYPEWRITER FINDER:` badge with black inverted background.
2. Search input with monospace prompt `>>` and hard drop shadow `2px 2px 0px #1c1b1b`.
3. `STREAMING FLAC DIRECT` badge with pulsing red recording dot (`REC ●`).
4. Running retro ticker tape on desktop (`ISSUE #94 /// LIVE SUBSONIC FLAC /// NO COMMERCIAL RADIO ALLOWED /// XEROX RIPS`).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/dwidora/Projects/My/navidwirome/ui && npx vitest run src/layout/AppBar.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ui/src/layout/AppBar.jsx ui/src/layout/AppBar.test.jsx
git commit -m "feat(ui): add Typewriter Finder header and retro ticker bar"
```

---

### Task 4: Audiozine Cassette Deck Sidebar Navigation (`Menu.jsx`)

**Files:**
- Modify: `ui/src/layout/Menu.jsx:1-120`
- Test: `ui/src/layout/Menu.test.jsx`

**Interfaces:**
- Produces: Brutalist audiozine sidebar navigation with cassette crate menu items and server status chunk
- Consumes: React-Admin navigation routes (`/album`, `/artist`, `/song`, `/playlist`, `/radio`)

- [ ] **Step 1: Write failing test in `Menu.test.jsx`**

Add unit tests asserting that the sidebar contains the `UNDERGROUND AUDIO REC` title banner, `DISCOVER / VAULT` and `MIXTAPES & CASSETTES` links, and the Subsonic server status box:

```javascript
it('renders Audiozine Cassette Deck header and navigation items', () => {
  renderWithRedux(<Menu />)
  expect(screen.getByText(/NAVIDROME \/\/ V.94/i)).toBeInTheDocument()
  expect(screen.getByText(/DISCOVER \/ VAULT/i)).toBeInTheDocument()
  expect(screen.getByText(/MIXTAPES & CASSETTES/i)).toBeInTheDocument()
  expect(screen.getByText(/SERVER STATUS \/\/ SUBSONIC/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/dwidora/Projects/My/navidwirome/ui && npx vitest run src/layout/Menu.test.jsx`
Expected: FAIL

- [ ] **Step 3: Implement Audiozine Sidebar in `Menu.jsx`**

Update `Menu.jsx`:
- Top Banner: Inverted black box tilted `rotate(-1deg)` with `UNDERGROUND AUDIO REC ●` and `NAVIDROME // V.94 AUDIOZINE RIOT CRATE`.
- Sub-banner: `XEROX RUN IDENTIFIER: CASSETTE-STREAM-DECK #882`.
- Navigation items mapped to zine labels:
  - Albums $\to$ `DISCOVER / VAULT`
  - Playlists $\to$ `MIXTAPES & CASSETTES`
  - Artists $\to$ `BANDS & ARTISTS`
  - Songs $\to$ `VINYL / CD CRATES`
  - Radios $\to$ `LOCAL RADIO FM`
- Bottom Server Status chunk: `SERVER STATUS // SUBSONIC ONLINE 99.4% CHUNKED` and warning label `PULL TAPE BEFORE EJECTING. DO NOT DUPLICATE COMMERCIALLY.`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/dwidora/Projects/My/navidwirome/ui && npx vitest run src/layout/Menu.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ui/src/layout/Menu.jsx ui/src/layout/Menu.test.jsx
git commit -m "feat(ui): reskin sidebar into Audiozine Cassette Deck"
```

---

### Task 5: Polaroid Album Cards & Cassette Crate Grid (`AlbumCard.jsx` / `AlbumGrid.jsx`)

**Files:**
- Modify: `ui/src/album/AlbumCard.jsx:1-120`
- Modify: `ui/src/album/AlbumGrid.jsx:1-100`
- Test: `ui/src/album/AlbumCard.test.jsx`

**Interfaces:**
- Produces: Polaroid-style album cards with staggered rotation tilts, masking tape accents, and format badges
- Consumes: Navidrome `Album` records (`id`, `name`, `artist`, `year`, `genre`, `songCount`)

- [ ] **Step 1: Write failing test in `AlbumCard.test.jsx`**

Assert that `AlbumCard` renders Polaroid container styling, release year badge, and format metadata:

```javascript
it('renders polaroid frame with release year badge and format metadata', () => {
  const album = { id: 'alb-1', name: 'Nevermind: Unmastered', artist: 'Nirvana', year: 1991, songCount: 11 }
  renderWithRedux(<AlbumCard record={album} />)
  expect(screen.getByText('1991')).toBeInTheDocument()
  expect(screen.getByText(/11 CUTS/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/dwidora/Projects/My/navidwirome/ui && npx vitest run src/album/AlbumCard.test.jsx`
Expected: FAIL

- [ ] **Step 3: Implement Polaroid & Masking Tape styling in `AlbumCard.jsx`**

Update `AlbumCard.jsx`:
- Hard 2px solid `#1c1b1b` border with `3px 3px 0px #1c1b1b` drop-shadow.
- Staggered dynamic tilt based on record ID (`rotate(-1deg)` to `rotate(1.5deg)`).
- Semi-translucent masking tape strip positioned on top edge (`background: rgba(244, 239, 230, 0.85)`).
- Stamp overlay for release year (`1991`) and format tag (`WAV / LOSSLESS`, `FLAC STEREO`).
- Hover state: resets tilt to `rotate(0deg)` and expands shadow to `6px 6px 0px #1c1b1b`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/dwidora/Projects/My/navidwirome/ui && npx vitest run src/album/AlbumCard.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ui/src/album/
git commit -m "feat(ui): add Polaroid styling and masking tape overlays to album cards"
```

---

### Task 6: Live Setlist Queue Drawer & Frequency Equalizer (`NowPlayingPanel.jsx`)

**Files:**
- Modify: `ui/src/layout/NowPlayingPanel.jsx:1-120`
- Test: `ui/src/layout/NowPlayingPanel.test.jsx`

**Interfaces:**
- Produces: Live Setlist panel with "Now Blasting" card, animated equalizer bars, and numbered queue list
- Consumes: Redux `player.queue` and `player.currentTrack`

- [ ] **Step 1: Write failing test in `NowPlayingPanel.test.jsx`**

Verify that `NowPlayingPanel` renders `LIVE SETLIST // DECK QUEUE`, the `NOW BLASTING` header, and action buttons `CLEAR STASH` and `SHUFFLE REEL`:

```javascript
it('renders Live Setlist header, Now Blasting card, and queue actions', () => {
  renderWithRedux(<NowPlayingPanel open={true} />)
  expect(screen.getByText(/LIVE SETLIST \/\/ DECK QUEUE/i)).toBeInTheDocument()
  expect(screen.getByText(/NOW BLASTING/i)).toBeInTheDocument()
  expect(screen.getByText(/CLEAR STASH/i)).toBeInTheDocument()
  expect(screen.getByText(/SHUFFLE REEL/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/dwidora/Projects/My/navidwirome/ui && npx vitest run src/layout/NowPlayingPanel.test.jsx`
Expected: FAIL

- [ ] **Step 3: Implement Live Setlist in `NowPlayingPanel.jsx`**

Update `NowPlayingPanel.jsx`:
- Stage setlist header with masking tape graphic anchor.
- **Now Blasting card**: Riot Blue background, track name, artist, and CSS vertical bar equalizer simulating audio spectrum.
- Queued tracks list rendered with numbered monospace prefixes (`02.`, `03.`), song title, artist, and duration.
- Buttons: `CLEAR STASH` (triggers `clearQueue()`) and `SHUFFLE REEL` (triggers queue shuffle).
- Cache & hardware stats chunk: `LOCAL CASSETTE CACHE` gauge and latency indicator.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/dwidora/Projects/My/navidwirome/ui && npx vitest run src/layout/NowPlayingPanel.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ui/src/layout/NowPlayingPanel.jsx ui/src/layout/NowPlayingPanel.test.jsx
git commit -m "feat(ui): implement Live Setlist queue drawer with frequency equalizer"
```

---

### Task 7: Full Frontend Production Build & End-to-End Verification

**Files:**
- Modify: `ui/src/config.js` (default theme set to `Riot Xerox`)
- Run: `npm run build` in `ui/`
- Run: Full vitest suite

**Interfaces:**
- Produces: Production-ready bundled assets in `ui/build/`
- Consumes: Go embed fs in `server/public.go`

- [ ] **Step 1: Set `defaultTheme: 'Riot Xerox'` in `config.js`**

Configure `Riot Xerox` as the default active theme so users immediately land on the new design.

- [ ] **Step 2: Run full unit test suite**

Run: `cd /home/dwidora/Projects/My/navidwirome/ui && npm test`
Expected: All test suites PASS (pristine output, 0 regressions).

- [ ] **Step 3: Execute production build**

Run: `cd /home/dwidora/Projects/My/navidwirome/ui && npm run build`
Expected: Vite build succeeds and generates optimized bundles in `ui/build/`.

- [ ] **Step 4: Recompile Go binary with embedded UI**

Run: `cd /home/dwidora/Projects/My/navidwirome && go build -tags "netgo sqlite_fts5 fts5" -o navidwirome .`
Expected: Binary compiles cleanly.

- [ ] **Step 5: Commit and tag completion**

```bash
git add ui/
git commit -m "feat(ui): complete Riot Xerox Underground redesign and build production bundle"
```
