import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { usePlayerStore } from './store/usePlayerStore'
import LoginView from './components/auth/LoginView'
import ShellLayout from './components/shell/ShellLayout'
import DiscoverView from './views/DiscoverView'
import AlbumsView from './views/AlbumsView'
import AlbumDetailView from './views/AlbumDetailView'
import ArtistsView from './views/ArtistsView'
import ArtistDetailView from './views/ArtistDetailView'
import SongsView from './views/SongsView'
import PlaylistsView from './views/PlaylistsView'
import PlaylistDetailView from './views/PlaylistDetailView'
import SettingsView from './views/SettingsView'

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Spacebar toggles playback unless typing in input/textarea/contentEditable
      if (e.code === 'Space' || e.key === ' ') {
        const target = e.target
        const isInput =
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable ||
            target.getAttribute?.('role') === 'textbox')
        if (!isInput) {
          e.preventDefault()
          usePlayerStore.getState().togglePlay()
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

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
    <HashRouter>
      <ShellLayout>
        <Routes>
          <Route path="/" element={<DiscoverView />} />
          <Route path="/discover" element={<Navigate to="/" replace />} />
          <Route path="/albums" element={<AlbumsView />} />
          <Route path="/albums/:id" element={<AlbumDetailView />} />
          <Route path="/artists" element={<ArtistsView />} />
          <Route path="/artists/:id" element={<ArtistDetailView />} />
          <Route path="/songs" element={<SongsView />} />
          <Route path="/playlists" element={<PlaylistsView />} />
          <Route path="/playlists/:id" element={<PlaylistDetailView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route
            path="*"
            element={
              <div className="p-8 text-center text-on-surface-variant text-sm font-mono">
                View coming soon.
              </div>
            }
          />
        </Routes>
      </ShellLayout>
    </HashRouter>
  )
}
