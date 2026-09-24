# Warm Audiophile Matte UI (v2) Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a greenfield React 19 + Vite + Tailwind CSS SPA for Navidwirome in `ui-v2/` implementing the Warm Audiophile Matte design system, Subsonic authentication, 3-zone layout shell, and audio playback engine.

**Architecture:** A standalone SPA in `ui-v2/` completely decoupled from legacy React-Admin. Uses Zustand stores for auth, player state, and UI state; a singleton HTML5 Audio manager for background audio streaming; and Tailwind CSS with custom design tokens from Stitch.

**Tech Stack:** React 19, Vite, Tailwind CSS, Zustand, React Router v6, Blueimp MD5, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-24-warm-audiophile-ui-v2-phase1-design.md`

## Global Constraints
- Target directory: `ui-v2/` exclusively (leave `ui/` legacy untouched until migration).
- Visual tokens: strictly follow Warm Audiophile Matte palette (`#131315`, `#1b1b1d`, `#2e2d33`, `#d97746`, `#f4f3f0`).
- Typography: Newsreader (headlines/titles), Manrope (interface/body), JetBrains Mono (durations/bitrates).
- Icons: Google Material Symbols Outlined.
- Subsonic protocol: salt + md5 token authentication (`u={username}&t={token}&s={salt}&v=1.8.0&c=NavidwiromeStudio&f=json`).
- Audio singleton: HTML5 Audio decoupled from React component lifecycle to prevent playback interruptions during routing.

## Review Focus
1. Malformed or expired Subsonic auth tokens on boot -> gracefully clear localStorage and redirect to LoginView instead of blank screen or crash loop (tested in Task 2).
2. Missing or failed cover art network requests -> `<Artwork />` must catch image load errors and display fallback vinyl record SVG without broken image icon (tested in Task 4).
3. Rapid play/pause or track skipping -> audio manager must avoid audio element play() Promise rejections or overlapping audio streams (tested in Task 3).
4. Volume state boundary conditions -> volume must be clamped strictly to [0.0, 1.0] and initialized safely from localStorage (tested in Task 3).
5. Window resize & right panel toggle -> 3-zone shell must strictly preserve fixed 100vh layout without document-level body scrollbars (tested in Task 5).

---

### Task 1: Project Scaffolding & Design System Setup

**Files:**
- Create: `ui-v2/package.json`
- Create: `ui-v2/vite.config.js`
- Create: `ui-v2/tailwind.config.js`
- Create: `ui-v2/postcss.config.js`
- Create: `ui-v2/index.html`
- Create: `ui-v2/src/styles/index.css`
- Create: `ui-v2/src/main.jsx`
- Create: `ui-v2/src/App.jsx`
- Test: `ui-v2/src/App.test.jsx`

**Interfaces:**
- Produces: Running Vite dev server and build pipeline configured with Warm Audiophile Matte Tailwind tokens, fonts, and Vitest test runner.

- [ ] **Step 1: Create `ui-v2/package.json` with dependencies**

```json
{
  "name": "navidwirome-ui-v2",
  "private": true,
  "version": "2.4.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "blueimp-md5": "^2.19.0",
    "clsx": "^2.1.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.26.2",
    "tailwind-merge": "^2.5.2",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.11",
    "vite": "^5.4.6",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Create `ui-v2/vite.config.js` with proxy to Navidwirome Go backend**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '^/(auth|api|rest|backgrounds)/.*': 'http://localhost:4533',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
})
```

- [ ] **Step 3: Create `ui-v2/tailwind.config.js` with Audiophile Matte design tokens**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#131315',
        'surface-container-lowest': '#0e0e10',
        'surface-container-low': '#1b1b1d',
        'surface-container': '#1f1f22',
        'surface-container-high': '#242427',
        'surface-container-highest': '#333237',
        outline: '#4a423d',
        'outline-variant': '#2e2d33',
        primary: '#d97746',
        'primary-bright': '#f08d5b',
        'primary-container': '#ffdbcc',
        'on-surface': '#f4f3f0',
        'on-surface-variant': '#a8a5a0',
        'on-surface-dim': '#545663',
      },
      fontFamily: {
        serif: ['Newsreader', 'serif'],
        sans: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.25rem', // 4px
        lg: '0.5rem',       // 8px
        xl: '0.75rem',      // 12px
        full: '9999px',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Create `ui-v2/postcss.config.js`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Create `ui-v2/index.html` loading Newsreader, Manrope, JetBrains Mono & Material Symbols**

```html
<!DOCTYPE html>
<html class="dark" lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Navidwirome Studio</title>
    <!-- Google Fonts: Newsreader, Manrope, JetBrains Mono -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@300;400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400&display=swap"
      rel="stylesheet"
    />
    <!-- Material Symbols Outlined -->
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
    />
  </head>
  <body class="bg-background text-on-surface antialiased overflow-hidden select-none">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `ui-v2/src/styles/index.css` and `ui-v2/src/setupTests.js`**

`ui-v2/src/styles/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    overscroll-behavior: none;
    background-color: #131315;
    color: #f4f3f0;
  }
}

/* Minimalist scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #2e2d33;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #4a423d;
}
```

`ui-v2/src/setupTests.js`:
```javascript
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Create initial `ui-v2/src/App.jsx` and `ui-v2/src/main.jsx`**

`ui-v2/src/App.jsx`:
```jsx
import React from 'react'

export default function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-on-surface">
      <h1 className="font-serif text-3xl text-primary">Navidwirome Studio v2</h1>
    </div>
  )
}
```

`ui-v2/src/main.jsx`:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 8: Write test for initial App render in `ui-v2/src/App.test.jsx`**

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders initial application title', () => {
    render(<App />)
    expect(screen.getByText(/Navidwirome Studio v2/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 9: Run npm install, test suite, and verify production build in `ui-v2/`**

Run:
```bash
cd ui-v2 && npm install && npm test && npm run build
```
Expected: PASS all tests, `dist/` directory generated.

- [ ] **Step 10: Commit scaffold**

```bash
git add ui-v2
git commit -m "feat(ui-v2): scaffold project with Vite, React 19, Tailwind CSS, and test runner"
```

---

### Task 2: Subsonic API Client & Authentication Store

**Files:**
- Create: `ui-v2/src/api/subsonic.js`
- Test: `ui-v2/src/api/subsonic.test.js`
- Create: `ui-v2/src/store/useAuthStore.js`
- Test: `ui-v2/src/store/useAuthStore.test.js`
- Create: `ui-v2/src/components/auth/LoginView.jsx`
- Test: `ui-v2/src/components/auth/LoginView.test.jsx`

**Interfaces:**
- Produces:
  - `subsonic.login(username, password)` -> Promise<{ username, token, salt }>
  - `subsonic.ping()` -> Promise<boolean>
  - `subsonic.getStreamUrl(songId)` -> string
  - `subsonic.getCoverArtUrl(record, size, square)` -> string
  - `subsonic.getPlaylists()` -> Promise<Array<Playlist>>
  - `subsonic.getAlbumList2(type, size)` -> Promise<Array<Album>>
  - `useAuthStore` -> Zustand store with `{ user, isAuthenticated, login, logout, checkAuth }`
  - `<LoginView onLoginSuccess={fn} />`

- [ ] **Step 1: Write unit tests for Subsonic API client in `ui-v2/src/api/subsonic.test.js`**

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import subsonic from './subsonic'

describe('subsonic API client', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('builds authenticated URL with salt and md5 token', () => {
    subsonic.setCredentials('alice', 'testtoken123', 'randomsalt456')
    const url = subsonic.buildUrl('ping')
    expect(url).toContain('/rest/ping?')
    expect(url).toContain('u=alice')
    expect(url).toContain('t=testtoken123')
    expect(url).toContain('s=randomsalt456')
    expect(url).toContain('v=1.8.0')
    expect(url).toContain('f=json')
  })

  it('generates defensive cover art URLs with proper prefixing', () => {
    subsonic.setCredentials('alice', 'testtoken123', 'randomsalt456')

    // Album record
    const albumUrl = subsonic.getCoverArtUrl({ id: 'alb-1', albumArtist: 'Radiohead' }, 120, true)
    expect(albumUrl).toContain('id=al-alb-1')
    expect(albumUrl).toContain('size=120')

    // MediaFile / Song record
    const songUrl = subsonic.getCoverArtUrl({ id: 'sng-1', album: 'OK Computer' }, 120, true)
    expect(songUrl).toContain('id=mf-sng-1')

    // Playlist record
    const playlistUrl = subsonic.getCoverArtUrl({ id: 'pl-1', sync: true }, 120, true)
    expect(playlistUrl).toContain('id=pl-pl-1')
  })

  it('handles malformed auth on boot by returning false from ping', async () => {
    subsonic.setCredentials('alice', 'invalid-token', 'salt')
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ 'subsonic-response': { status: 'failed', error: { code: 40 } } }),
    })

    const isAlive = await subsonic.ping()
    expect(isAlive).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ui-v2 && npm test -- subsonic.test.js`
Expected: FAIL (file does not exist).

- [ ] **Step 3: Implement `ui-v2/src/api/subsonic.js`**

```javascript
import md5 from 'blueimp-md5'

class SubsonicClient {
  constructor() {
    this.username = localStorage.getItem('subsonic_username') || ''
    this.token = localStorage.getItem('subsonic_token') || ''
    this.salt = localStorage.getItem('subsonic_salt') || ''
    this.serverUrl = ''
  }

  setCredentials(username, token, salt) {
    this.username = username
    this.token = token
    this.salt = salt
    localStorage.setItem('subsonic_username', username)
    localStorage.setItem('subsonic_token', token)
    localStorage.setItem('subsonic_salt', salt)
  }

  clearCredentials() {
    this.username = ''
    this.token = ''
    this.salt = salt = ''
    localStorage.removeItem('subsonic_username')
    localStorage.removeItem('subsonic_token')
    localStorage.removeItem('subsonic_salt')
  }

  hasCredentials() {
    return Boolean(this.username && this.token && this.salt)
  }

  createToken(password) {
    const salt = Math.random().toString(36).substring(2, 12)
    const token = md5(password + salt)
    return { token, salt }
  }

  buildUrl(endpoint, params = {}) {
    const searchParams = new URLSearchParams()
    searchParams.append('u', this.username)
    searchParams.append('t', this.token)
    searchParams.append('s', this.salt)
    searchParams.append('v', '1.8.0')
    searchParams.append('c', 'NavidwiromeStudio')
    searchParams.append('f', 'json')

    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        searchParams.append(k, String(v))
      }
    })

    return `${this.serverUrl}/rest/${endpoint}?${searchParams.toString()}`
  }

  async request(endpoint, params = {}) {
    const url = this.buildUrl(endpoint, params)
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Subsonic API request failed with status ${res.status}`)
    }
    const data = await res.json()
    const response = data['subsonic-response']
    if (response?.status === 'failed') {
      const err = new Error(response.error?.message || 'Subsonic API error')
      err.code = response.error?.code
      throw err
    }
    return response
  }

  async login(username, password) {
    const { token, salt } = this.createToken(password)
    this.setCredentials(username, token, salt)
    try {
      const ok = await this.ping()
      if (!ok) throw new Error('Invalid credentials')
      return { username, token, salt }
    } catch (err) {
      this.clearCredentials()
      throw err
    }
  }

  async ping() {
    try {
      const res = await this.request('ping')
      return res?.status === 'ok'
    } catch {
      return false
    }
  }

  getStreamUrl(songId) {
    return this.buildUrl('stream', { id: songId })
  }

  getCoverArtUrl(record, size = 300, square = true) {
    if (!record?.id) return ''
    let id = record.id
    if (record.album && !record.songCount) {
      id = `mf-${record.id}`
    } else if (record.albumArtist || record.songCount !== undefined || (record.name && record.artist && !record.title)) {
      id = `al-${record.id}`
    } else if (record.sync !== undefined) {
      id = `pl-${record.id}`
    } else {
      id = `ar-${record.id}`
    }
    return this.buildUrl('getCoverArt', { id, size, square })
  }

  async getPlaylists() {
    const res = await this.request('getPlaylists')
    return res?.playlists?.playlist || []
  }

  async getAlbumList2(type = 'recent', size = 20) {
    const res = await this.request('getAlbumList2', { type, size })
    return res?.albumList2?.album || []
  }
}

const subsonic = new SubsonicClient()
export default subsonic
```

- [ ] **Step 4: Run test to verify `subsonic.test.js` passes**

Run: `cd ui-v2 && npm test -- subsonic.test.js`
Expected: PASS.

- [ ] **Step 5: Write test for `useAuthStore` in `ui-v2/src/store/useAuthStore.test.js`**

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from './useAuthStore'
import subsonic from '../api/subsonic'

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true })
    vi.restoreAllMocks()
  })

  it('initializes and checks existing session', async () => {
    subsonic.setCredentials('bob', 'token123', 'salt456')
    vi.spyOn(subsonic, 'ping').mockResolvedValue(true)

    await useAuthStore.getState().checkAuth()

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user?.username).toBe('bob')
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('resets session if token is invalid or expired', async () => {
    subsonic.setCredentials('bob', 'expired', 'salt')
    vi.spyOn(subsonic, 'ping').mockResolvedValue(false)

    await useAuthStore.getState().checkAuth()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBe(null)
  })
})
```

- [ ] **Step 6: Implement `ui-v2/src/store/useAuthStore.js`**

```javascript
import { create } from 'zustand'
import subsonic from '../api/subsonic'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true, error: null })
    if (!subsonic.hasCredentials()) {
      set({ isAuthenticated: false, user: null, isLoading: false })
      return false
    }
    const isAlive = await subsonic.ping()
    if (isAlive) {
      set({
        isAuthenticated: true,
        user: { username: subsonic.username },
        isLoading: false,
      })
      return true
    } else {
      subsonic.clearCredentials()
      set({ isAuthenticated: false, user: null, isLoading: false })
      return false
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null })
    try {
      await subsonic.login(username, password)
      set({
        isAuthenticated: true,
        user: { username },
        isLoading: false,
        error: null,
      })
      return true
    } catch (err) {
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: err.message || 'Login failed',
      })
      return false
    }
  },

  logout: () => {
    subsonic.clearCredentials()
    set({ isAuthenticated: false, user: null, error: null })
  },
}))
```

- [ ] **Step 7: Implement `ui-v2/src/components/auth/LoginView.jsx` and its test**

`ui-v2/src/components/auth/LoginView.jsx`:
```jsx
import React, { useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'

export default function LoginView() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) return
    await login(username, password)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-outline-variant bg-surface-container-low p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/30 bg-surface-container text-primary">
            <span className="material-symbols-outlined text-2xl">graphic_eq</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-on-surface">Navidwirome</h1>
          <span className="font-mono text-xs uppercase tracking-wider text-primary">Studio Edition</span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-center text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1 font-mono uppercase">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full h-10 rounded-lg border border-outline-variant bg-surface-container px-3 text-sm text-on-surface placeholder:text-on-surface-dim focus:border-primary focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1 font-mono uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 rounded-lg border border-outline-variant bg-surface-container px-3 text-sm text-on-surface placeholder:text-on-surface-dim focus:border-primary focus:outline-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 h-10 rounded-lg bg-primary font-medium text-sm text-white hover:bg-primary-bright transition-colors shadow-md disabled:opacity-50"
          >
            {isLoading ? 'Connecting...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

`ui-v2/src/components/auth/LoginView.test.jsx`:
```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginView from './LoginView'
import { useAuthStore } from '../../store/useAuthStore'

describe('LoginView', () => {
  it('renders login form inputs and submits credentials', async () => {
    const loginMock = vi.fn().mockResolvedValue(true)
    useAuthStore.setState({ login: loginMock, isLoading: false, error: null })

    render(<LoginView />)

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'audiophile' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    expect(loginMock).toHaveBeenCalledWith('audiophile', 'secret')
  })
})
```

- [ ] **Step 8: Run all auth tests and commit**

Run: `cd ui-v2 && npm test`
Expected: PASS all tests.

```bash
git add ui-v2
git commit -m "feat(ui-v2): implement Subsonic client, auth store, and warm audiophile login view"
```

---

### Task 3: Singleton Audio Engine & Player Store

**Files:**
- Create: `ui-v2/src/audio/audioManager.js`
- Test: `ui-v2/src/audio/audioManager.test.js`
- Create: `ui-v2/src/store/usePlayerStore.js`
- Test: `ui-v2/src/store/usePlayerStore.test.js`

**Interfaces:**
- Produces:
  - `audioManager`: Singleton controlling HTML5 audio, play, pause, seek, volume, and event dispatch.
  - `usePlayerStore`: Zustand store managing `{ currentTrack, queue, queueIndex, isPlaying, currentTime, duration, volume, playTrack, togglePlay, seek, setVolume, playNext, playPrev }`.

- [ ] **Step 1: Write tests for `audioManager` in `ui-v2/src/audio/audioManager.test.js`**

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { audioManager } from './audioManager'

describe('audioManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    audioManager.init()
  })

  it('initializes and manages volume within [0, 1] range', () => {
    audioManager.setVolume(0.5)
    expect(audioManager.getVolume()).toBe(0.5)

    // Clamping checks
    audioManager.setVolume(-0.2)
    expect(audioManager.getVolume()).toBe(0)

    audioManager.setVolume(1.5)
    expect(audioManager.getVolume()).toBe(1)
  })

  it('safely handles play and pause calls without throwing', async () => {
    const playSpy = vi.spyOn(audioManager.audio, 'play').mockResolvedValue(undefined)
    const pauseSpy = vi.spyOn(audioManager.audio, 'pause').mockImplementation(() => {})

    await audioManager.play('http://localhost:3000/stream?id=123')
    expect(playSpy).toHaveBeenCalled()

    audioManager.pause()
    expect(pauseSpy).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Implement `ui-v2/src/audio/audioManager.js`**

```javascript
class AudioManager {
  constructor() {
    this.audio = new Audio()
    this.audio.preload = 'auto'
    this.listeners = new Map()

    const savedVol = localStorage.getItem('navidwirome_volume')
    this.audio.volume = savedVol !== null ? Math.min(Math.max(parseFloat(savedVol), 0), 1) : 0.8

    this.attachEvents()
  }

  init() {
    // idempotent initialization
    return this
  }

  attachEvents() {
    this.audio.addEventListener('timeupdate', () => {
      this.emit('timeupdate', this.audio.currentTime)
    })
    this.audio.addEventListener('durationchange', () => {
      this.emit('durationchange', this.audio.duration || 0)
    })
    this.audio.addEventListener('ended', () => {
      this.emit('ended')
    })
    this.audio.addEventListener('play', () => {
      this.emit('playState', true)
    })
    this.audio.addEventListener('pause', () => {
      this.emit('playState', false)
    })
    this.audio.addEventListener('error', (e) => {
      this.emit('error', e)
    })
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
    return () => this.listeners.get(event)?.delete(callback)
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach((cb) => cb(data))
  }

  async play(src) {
    if (src && this.audio.src !== src) {
      this.audio.src = src
    }
    try {
      await this.audio.play()
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Audio playback failed:', err)
      }
    }
  }

  pause() {
    this.audio.pause()
  }

  seek(seconds) {
    if (Number.isFinite(seconds)) {
      this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration || seconds))
    }
  }

  setVolume(vol) {
    const clamped = Math.max(0, Math.min(vol, 1))
    this.audio.volume = clamped
    localStorage.setItem('navidwirome_volume', String(clamped))
    this.emit('volumechange', clamped)
  }

  getVolume() {
    return this.audio.volume
  }
}

export const audioManager = new AudioManager()
```

- [ ] **Step 3: Run `audioManager.test.js` to verify it passes**

Run: `cd ui-v2 && npm test -- audioManager.test.js`
Expected: PASS.

- [ ] **Step 4: Write tests for `usePlayerStore` in `ui-v2/src/store/usePlayerStore.test.js`**

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePlayerStore } from './usePlayerStore'
import { audioManager } from '../audio/audioManager'
import subsonic from '../api/subsonic'

describe('usePlayerStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    usePlayerStore.setState({
      currentTrack: null,
      queue: [],
      queueIndex: -1,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    })
    subsonic.setCredentials('alice', 'tok', 'salt')
  })

  it('sets queue, plays track, and advances to next track', async () => {
    vi.spyOn(audioManager, 'play').mockResolvedValue(undefined)

    const tracks = [
      { id: '1', title: 'Track 1', artist: 'Artist 1', duration: 180 },
      { id: '2', title: 'Track 2', artist: 'Artist 2', duration: 200 },
    ]

    await usePlayerStore.getState().playTrack(tracks[0], tracks)

    expect(usePlayerStore.getState().currentTrack?.id).toBe('1')
    expect(usePlayerStore.getState().queueIndex).toBe(0)
    expect(usePlayerStore.getState().isPlaying).toBe(true)

    // Play next
    await usePlayerStore.getState().playNext()
    expect(usePlayerStore.getState().currentTrack?.id).toBe('2')
    expect(usePlayerStore.getState().queueIndex).toBe(1)
  })
})
```

- [ ] **Step 5: Implement `ui-v2/src/store/usePlayerStore.js`**

```javascript
import { create } from 'zustand'
import { audioManager } from '../audio/audioManager'
import subsonic from '../api/subsonic'

export const usePlayerStore = create((set, get) => {
  // Bind manager events to store
  audioManager.on('timeupdate', (time) => set({ currentTime: time }))
  audioManager.on('durationchange', (dur) => set({ duration: dur }))
  audioManager.on('playState', (playing) => set({ isPlaying: playing }))
  audioManager.on('volumechange', (vol) => set({ volume: vol }))
  audioManager.on('ended', () => get().playNext())

  return {
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: audioManager.getVolume(),
    isShuffle: false,
    repeatMode: 'off', // 'off' | 'all' | 'one'

    playTrack: async (track, newQueue = null) => {
      const queue = newQueue || get().queue
      const index = queue.findIndex((t) => t.id === track.id)
      const streamUrl = subsonic.getStreamUrl(track.id)

      set({
        currentTrack: track,
        queue: queue.length > 0 ? queue : [track],
        queueIndex: index !== -1 ? index : 0,
        isPlaying: true,
      })

      await audioManager.play(streamUrl)
    },

    togglePlay: async () => {
      const { isPlaying, currentTrack, queue } = get()
      if (!currentTrack && queue.length > 0) {
        await get().playTrack(queue[0])
        return
      }
      if (isPlaying) {
        audioManager.pause()
      } else {
        await audioManager.play()
      }
    },

    seek: (seconds) => {
      audioManager.seek(seconds)
      set({ currentTime: seconds })
    },

    setVolume: (vol) => {
      audioManager.setVolume(vol)
    },

    playNext: async () => {
      const { queue, queueIndex, repeatMode, isShuffle } = get()
      if (queue.length === 0) return

      if (repeatMode === 'one' && get().currentTrack) {
        audioManager.seek(0)
        await audioManager.play()
        return
      }

      let nextIndex = queueIndex + 1
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * queue.length)
      } else if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0
        } else {
          audioManager.pause()
          set({ isPlaying: false, currentTime: 0 })
          return
        }
      }

      const nextTrack = queue[nextIndex]
      if (nextTrack) {
        await get().playTrack(nextTrack, queue)
      }
    },

    playPrev: async () => {
      const { queue, queueIndex, currentTime } = get()
      if (currentTime > 3) {
        audioManager.seek(0)
        return
      }
      const prevIndex = queueIndex - 1
      if (prevIndex >= 0 && queue[prevIndex]) {
        await get().playTrack(queue[prevIndex], queue)
      } else {
        audioManager.seek(0)
      }
    },

    toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),

    toggleRepeat: () =>
      set((state) => {
        const modes = ['off', 'all', 'one']
        const next = modes[(modes.indexOf(state.repeatMode) + 1) % modes.length]
        return { repeatMode: next }
      }),
  }
})
```

- [ ] **Step 6: Run tests and commit Task 3**

Run: `cd ui-v2 && npm test`
Expected: PASS all tests.

```bash
git add ui-v2
git commit -m "feat(ui-v2): add singleton audioManager and usePlayerStore"
```

---

### Task 4: Common Components (Artwork & Scrubber)

**Files:**
- Create: `ui-v2/src/components/common/Artwork.jsx`
- Test: `ui-v2/src/components/common/Artwork.test.jsx`
- Create: `ui-v2/src/components/common/Scrubber.jsx`
- Test: `ui-v2/src/components/common/Scrubber.test.jsx`

**Interfaces:**
- Produces:
  - `<Artwork record={record} size={120} square={true} className="..." alt="..." />`
  - `<Scrubber value={currentTime} max={duration} onChange={fn} formatLabel={bool} />`

- [ ] **Step 1: Write test for `<Artwork />` in `ui-v2/src/components/common/Artwork.test.jsx`**

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Artwork from './Artwork'
import subsonic from '../../api/subsonic'

describe('Artwork component', () => {
  it('renders image with defensive Subsonic artwork URL', () => {
    vi.spyOn(subsonic, 'getCoverArtUrl').mockReturnValue('http://localhost:3000/rest/getCoverArt?id=al-1')

    render(<Artwork record={{ id: '1', albumArtist: 'Artist' }} size={120} alt="Cover" />)
    const img = screen.getByRole('img', { name: 'Cover' })
    expect(img).toHaveAttribute('src', 'http://localhost:3000/rest/getCoverArt?id=al-1')
  })

  it('renders fallback vinyl placeholder on image load failure', () => {
    vi.spyOn(subsonic, 'getCoverArtUrl').mockReturnValue('http://invalid-art')

    render(<Artwork record={{ id: '1' }} alt="Cover" />)
    const img = screen.getByRole('img', { name: 'Cover' })

    fireEvent.error(img)

    expect(screen.getByTestId('artwork-placeholder')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Implement `ui-v2/src/components/common/Artwork.jsx`**

```jsx
import React, { useState } from 'react'
import subsonic from '../../api/subsonic'

export default function Artwork({ record, size = 300, square = true, className = '', alt = 'Album Artwork' }) {
  const [hasError, setHasError] = useState(false)
  const url = record ? subsonic.getCoverArtUrl(record, size, square) : ''

  if (!url || hasError) {
    return (
      <div
        data-testid="artwork-placeholder"
        className={`flex items-center justify-center bg-surface-container-high text-on-surface-dim ${className}`}
      >
        <span className="material-symbols-outlined text-[28px] opacity-40">album</span>
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
    />
  )
}
```

- [ ] **Step 3: Write test for `<Scrubber />` in `ui-v2/src/components/common/Scrubber.test.jsx`**

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Scrubber from './Scrubber'

describe('Scrubber', () => {
  it('renders progress bar and fires onChange when interacted', () => {
    const changeMock = vi.fn()
    render(<Scrubber value={30} max={100} onChange={changeMock} />)

    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('aria-valuenow', '30')

    fireEvent.change(slider, { target: { value: '60' } })
    expect(changeMock).toHaveBeenCalledWith(60)
  })
})
```

- [ ] **Step 4: Implement `ui-v2/src/components/common/Scrubber.jsx`**

```jsx
import React from 'react'

export default function Scrubber({
  value = 0,
  max = 100,
  onChange,
  className = '',
  color = 'bg-primary',
}) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  return (
    <div className={`relative flex items-center h-4 w-full group cursor-pointer ${className}`}>
      <div className="relative w-full h-[3px] rounded-full bg-outline-variant group-hover:h-[5px] transition-all">
        <div
          className={`absolute left-0 top-0 bottom-0 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min="0"
        max={max || 100}
        value={value || 0}
        onChange={(e) => onChange && onChange(parseFloat(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-valuenow={value}
        aria-valuemin="0"
        aria-valuemax={max}
      />
    </div>
  )
}
```

- [ ] **Step 5: Run tests and commit Task 4**

Run: `cd ui-v2 && npm test -- Artwork.test.jsx Scrubber.test.jsx`
Expected: PASS.

```bash
git add ui-v2
git commit -m "feat(ui-v2): add defensive Artwork and custom Scrubber components"
```

---

### Task 5: 3-Zone Shell Layout & Navigation Components

**Files:**
- Create: `ui-v2/src/store/useUIStore.js`
- Create: `ui-v2/src/components/shell/Sidebar.jsx`
- Create: `ui-v2/src/components/shell/Header.jsx`
- Create: `ui-v2/src/components/shell/PlayerBar.jsx`
- Create: `ui-v2/src/components/shell/RightPanel.jsx`
- Create: `ui-v2/src/components/shell/ShellLayout.jsx`
- Test: `ui-v2/src/components/shell/ShellLayout.test.jsx`

**Interfaces:**
- Produces: Complete persistent 100vh 3-zone shell with fixed sidebar, top header, bottom player bar, and collapsible right drawer.

- [ ] **Step 1: Implement `ui-v2/src/store/useUIStore.js`**

```javascript
import { create } from 'zustand'

export const useUIStore = create((set) => ({
  isRightPanelOpen: true,
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  activeTab: 'overview', // 'overview' | 'queue' | 'history'
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
```

- [ ] **Step 2: Implement `ui-v2/src/components/shell/Sidebar.jsx`**

```jsx
import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import subsonic from '../../api/subsonic'
import { useAuthStore } from '../../store/useAuthStore'

export default function Sidebar() {
  const [playlists, setPlaylists] = useState([])
  const { user } = useAuthStore()

  useEffect(() => {
    subsonic.getPlaylists().then(setPlaylists).catch(() => setPlaylists([]))
  }, [])

  const navItems = [
    { to: '/', label: 'Discover', icon: 'explore' },
    { to: '/albums', label: 'Albums', icon: 'album' },
    { to: '/artists', label: 'Artists', icon: 'person' },
    { to: '/songs', label: 'Songs', icon: 'audiotrack' },
    { to: '/playlists', label: 'Playlists', icon: 'queue_music' },
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-[76px] w-[240px] bg-surface-container-lowest border-r border-outline-variant flex flex-col z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center gap-2.5 border-b border-outline-variant">
        <div className="w-8 h-8 rounded-lg bg-surface-container-low border border-primary/20 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[20px]">graphic_eq</span>
        </div>
        <div className="flex flex-col">
          <span className="font-serif text-base tracking-tight text-on-surface leading-tight font-semibold">
            Navidwirome
          </span>
          <span className="font-mono text-[10px] text-primary uppercase tracking-wider font-semibold">
            Studio v2.4
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search catalog (Cmd+K)"
            className="w-full h-9 pl-8 pr-2 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant text-xs focus:outline-none focus:border-primary transition-colors font-sans"
          />
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
        <nav className="space-y-1">
          <div className="px-2 pb-1 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant/70">
            Library
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium ${
                  isActive
                    ? 'bg-surface-container-high text-primary font-semibold border border-primary/20'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Playlists */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant/70">
              User Playlists
            </span>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
          <div className="space-y-0.5">
            {playlists.length === 0 ? (
              <p className="px-2 py-1 text-[11px] text-on-surface-dim italic">No playlists yet</p>
            ) : (
              playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface text-xs cursor-pointer group"
                >
                  <span className="truncate">{pl.name}</span>
                  <span className="font-mono text-[10px] text-on-surface-dim group-hover:text-primary">
                    {pl.songCount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Status Bar */}
      <div className="p-3 border-t border-outline-variant bg-surface-container-lowest/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs">
              <span className="material-symbols-outlined text-[16px]">person</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-on-surface leading-tight">
                {user?.username || 'Audiophile'}
              </span>
              <span className="font-mono text-[9px] text-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span> Lossless Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Implement `ui-v2/src/components/shell/Header.jsx`**

```jsx
import React from 'react'
import { useUIStore } from '../../store/useUIStore'

export default function Header() {
  const { activeTab, setActiveTab, isRightPanelOpen } = useUIStore()

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'queue', label: 'Up Next' },
    { id: 'history', label: 'History' },
  ]

  return (
    <header
      className={`fixed top-0 left-[240px] h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant z-20 flex items-center justify-between px-6 select-none transition-all ${
        isRightPanelOpen ? 'right-[320px]' : 'right-0'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <button className="w-7 h-7 rounded flex items-center justify-center text-on-surface-dim cursor-not-allowed">
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
        <div className="h-4 w-px bg-outline-variant mx-1" />
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs transition-colors font-medium ${
                activeTab === tab.id
                  ? 'bg-surface-container text-on-surface font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container border border-outline-variant">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="font-mono text-[10px] text-on-surface font-medium uppercase tracking-wider">
            Direct Stream
          </span>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Implement `ui-v2/src/components/shell/PlayerBar.jsx`**

```jsx
import React from 'react'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useUIStore } from '../../store/useUIStore'
import Artwork from '../common/Artwork'
import Scrubber from '../common/Scrubber'

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    seek,
    setVolume,
    playNext,
    playPrev,
    isShuffle,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerStore()

  const { isRightPanelOpen, toggleRightPanel } = useUIStore()

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-[76px] bg-surface-container-low border-t border-outline-variant z-50 px-4 flex items-center justify-between select-none">
      {/* Left: Track Meta */}
      <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
        <div className="w-12 h-12 rounded bg-surface-container-high overflow-hidden flex-shrink-0 border border-outline-variant">
          <Artwork record={currentTrack} size={100} className="w-full h-full" />
        </div>
        <div className="truncate pr-2">
          <h4 className="text-xs font-semibold text-on-surface truncate">
            {currentTrack?.title || 'No audio selected'}
          </h4>
          <p className="text-[11px] text-on-surface-variant truncate">
            {currentTrack?.artist || 'Ready to stream'}
          </p>
        </div>
        {currentTrack && (
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">favorite</span>
          </button>
        )}
      </div>

      {/* Center: Controls & Scrubber */}
      <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={`transition-colors ${isShuffle ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[18px]">shuffle</span>
          </button>
          <button onClick={playPrev} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[20px]">skip_previous</span>
          </button>
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-bright transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[22px]">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button onClick={playNext} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[20px]">skip_next</span>
          </button>
          <button
            onClick={toggleRepeat}
            className={`transition-colors ${repeatMode !== 'off' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {repeatMode === 'one' ? 'repeat_one' : 'repeat'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 w-full">
          <span className="font-mono text-[10px] text-on-surface-dim w-9 text-right">
            {formatTime(currentTime)}
          </span>
          <Scrubber value={currentTime} max={duration} onChange={seek} className="flex-1" />
          <span className="font-mono text-[10px] text-on-surface-dim w-9 text-left">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Volume & Drawer Toggle */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">
        {currentTrack?.bitRate && (
          <span className="px-1.5 py-0.5 rounded border border-outline-variant font-mono text-[9px] text-primary">
            {currentTrack.bitRate}k
          </span>
        )}
        <div className="flex items-center gap-2 w-28">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
          </span>
          <Scrubber value={volume} max={1} onChange={setVolume} className="flex-1" />
        </div>
        <button
          onClick={toggleRightPanel}
          className={`p-1 rounded transition-colors ${
            isRightPanelOpen ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
          title="Toggle Now Playing & Lyrics"
        >
          <span className="material-symbols-outlined text-[20px]">queue_music</span>
        </button>
      </div>
    </footer>
  )
}
```

- [ ] **Step 5: Implement `ui-v2/src/components/shell/RightPanel.jsx`**

```jsx
import React from 'react'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useUIStore } from '../../store/useUIStore'
import Artwork from '../common/Artwork'

export default function RightPanel() {
  const { currentTrack } = usePlayerStore()
  const { isRightPanelOpen, toggleRightPanel } = useUIStore()

  if (!isRightPanelOpen) return null

  return (
    <aside className="fixed right-0 top-0 bottom-[76px] w-[320px] bg-surface-container-lowest border-l border-outline-variant flex flex-col z-30 select-none">
      <div className="h-16 px-4 flex items-center justify-between border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="font-serif text-sm font-semibold text-on-surface">Now Playing</span>
          <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-mono text-[9px] font-bold uppercase tracking-wider">
            Studio
          </span>
        </div>
        <button
          onClick={toggleRightPanel}
          className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Large Artwork */}
        <div className="relative aspect-square w-full rounded-lg bg-surface-container-high overflow-hidden border border-outline-variant shadow-lg">
          <Artwork record={currentTrack} size={400} className="w-full h-full" />
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant font-mono text-[10px] text-primary font-medium">
            Lossless FLAC
          </div>
        </div>

        {/* Track Title & Artist */}
        <div className="space-y-1">
          <h3 className="font-serif text-base font-semibold text-on-surface truncate">
            {currentTrack?.title || 'No Track Selected'}
          </h3>
          <p className="text-xs text-on-surface-variant truncate">
            {currentTrack?.artist || 'Select a song to start'}
          </p>
          <p className="font-mono text-[10px] text-on-surface-dim uppercase tracking-wider">
            {currentTrack?.album ? `Album: ${currentTrack.album}` : 'Navidwirome Stream'}
          </p>
        </div>

        {/* Live Synchronized Lyrics Placeholder */}
        <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-outline-variant">
            <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">
              Live Synchronized Lyrics
            </span>
            <span className="font-mono text-[10px] text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Sync
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            <p className="text-xs text-on-surface-dim">Listening to music stream...</p>
            <p className="text-sm text-primary font-medium">Enjoy the high fidelity audio</p>
            <p className="text-xs text-on-surface-dim">Powered by Navidwirome</p>
          </div>
        </div>

        {/* Audio Pipeline Telemetry */}
        <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-medium pb-1 border-b border-outline-variant">
            Audio Pipeline Telemetry
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-on-surface-dim">Source Bitrate</span>
              <span className="font-mono text-xs text-on-surface font-semibold">
                {currentTrack?.bitRate ? `${currentTrack.bitRate} kbps` : 'Bit-Perfect'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-on-surface-dim">Format</span>
              <span className="font-mono text-xs text-primary font-semibold">
                {currentTrack?.suffix ? currentTrack.suffix.toUpperCase() : 'FLAC'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 6: Implement `ui-v2/src/components/shell/ShellLayout.jsx` and its test**

`ui-v2/src/components/shell/ShellLayout.jsx`:
```jsx
import React from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import PlayerBar from './PlayerBar'
import RightPanel from './RightPanel'
import { useUIStore } from '../../store/useUIStore'

export default function ShellLayout({ children }) {
  const { isRightPanelOpen } = useUIStore()

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-on-surface flex flex-col">
      <Sidebar />
      <Header />
      <main
        className={`pt-16 pb-[76px] pl-[240px] h-full overflow-y-auto transition-all ${
          isRightPanelOpen ? 'pr-[320px]' : 'pr-0'
        }`}
      >
        <div className="p-8 max-w-7xl mx-auto w-full">{children}</div>
      </main>
      <RightPanel />
      <PlayerBar />
    </div>
  )
}
```

`ui-v2/src/components/shell/ShellLayout.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ShellLayout from './ShellLayout'

describe('ShellLayout', () => {
  it('renders all 3 zones: Sidebar, Header, PlayerBar, and main child', () => {
    render(
      <BrowserRouter>
        <ShellLayout>
          <div data-testid="test-content">Dashboard Content</div>
        </ShellLayout>
      </BrowserRouter>
    )

    expect(screen.getByText(/Navidwirome/i)).toBeInTheDocument()
    expect(screen.getByText(/Direct Stream/i)).toBeInTheDocument()
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText(/Ready to stream/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 7: Run tests and commit Task 5**

Run: `cd ui-v2 && npm test -- ShellLayout.test.jsx`
Expected: PASS.

```bash
git add ui-v2
git commit -m "feat(ui-v2): implement 3-zone shell layout, sidebar, header, right panel, and player bar"
```

---

### Task 6: Initial Discover View & End-to-End Verification

**Files:**
- Create: `ui-v2/src/views/DiscoverView.jsx`
- Modify: `ui-v2/src/App.jsx`
- Test: `ui-v2/src/App.test.jsx`

**Interfaces:**
- Produces: Complete working application integrating Auth verification, 3-zone shell layout, live audio playback from Subsonic server, and quick-access albums.

- [ ] **Step 1: Implement `ui-v2/src/views/DiscoverView.jsx`**

```jsx
import React, { useEffect, useState } from 'react'
import subsonic from '../api/subsonic'
import { usePlayerStore } from '../store/usePlayerStore'
import Artwork from '../components/common/Artwork'

export default function DiscoverView() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const { playTrack } = usePlayerStore()

  useEffect(() => {
    subsonic
      .getAlbumList2('recent', 8)
      .then((data) => {
        setAlbums(data || [])
        setLoading(false)
      })
      .catch(() => {
        setAlbums([])
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-8">
      {/* Top Filter Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button className="px-4 py-1.5 rounded-full bg-on-surface text-background font-semibold text-xs transition-all">
          All
        </button>
        <button className="px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs transition-all">
          Albums
        </button>
        <button className="px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs transition-all">
          Playlists
        </button>
        <button className="px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs transition-all flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Hi-Res Masters
        </button>
      </div>

      {/* Quick Access Grid: 2x4 */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <h2 className="font-serif text-lg text-on-surface font-semibold tracking-tight">Quick Access</h2>
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Fast Recall</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-surface-container animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() => playTrack({ id: album.id, title: album.name, artist: album.artist })}
                className="group relative flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-outline-variant hover:bg-surface-container hover:border-primary/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-surface-container-high flex-shrink-0">
                    <Artwork record={album} size={100} className="w-full h-full" />
                  </div>
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                      {album.name}
                    </p>
                    <p className="text-[11px] text-on-surface-variant truncate">{album.artist}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Connect `App.jsx` with Auth gating and Router**

`ui-v2/src/App.jsx`:
```jsx
import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import LoginView from './components/auth/LoginView'
import ShellLayout from './components/shell/ShellLayout'
import DiscoverView from './views/DiscoverView'

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-primary">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginView />
  }

  return (
    <BrowserRouter>
      <ShellLayout>
        <Routes>
          <Route path="/" element={<DiscoverView />} />
          <Route
            path="*"
            element={
              <div className="p-8 text-center text-on-surface-variant text-sm font-mono">
                View coming in next phase.
              </div>
            }
          />
        </Routes>
      </ShellLayout>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Update `ui-v2/src/App.test.jsx` to test auth-gated flow**

```jsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { useAuthStore } from './store/useAuthStore'

describe('App Root', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders LoginView when not authenticated', () => {
    useAuthStore.setState({ isAuthenticated: false, isLoading: false, checkAuth: vi.fn() })
    render(<App />)
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('renders ShellLayout and DiscoverView when authenticated', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      isLoading: false,
      user: { username: 'dwinarwastu' },
      checkAuth: vi.fn(),
    })
    render(<App />)
    expect(screen.getByText(/Navidwirome/i)).toBeInTheDocument()
    expect(screen.getByText(/Quick Access/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run full test suite in `ui-v2/`**

Run: `cd ui-v2 && npm test`
Expected: PASS all tests across all test suites.

- [ ] **Step 5: Verify production bundle compiles cleanly**

Run: `cd ui-v2 && npm run build`
Expected: Clean production build with zero errors.

- [ ] **Step 6: Commit complete Phase 1 implementation**

```bash
git add ui-v2
git commit -m "feat(ui-v2): complete phase 1 with auth gating, discover view, and full test suite"
```
