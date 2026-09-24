import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import LoginView from './components/auth/LoginView'
import ShellLayout from './components/shell/ShellLayout'
import DiscoverView from './views/DiscoverView'
import AlbumsView from './views/AlbumsView'
import AlbumDetailView from './views/AlbumDetailView'
import ArtistsView from './views/ArtistsView'
import ArtistDetailView from './views/ArtistDetailView'
import SongsView from './views/SongsView'
import PlaylistsView from './views/PlaylistsView'

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
          <Route path="/discover" element={<Navigate to="/" replace />} />
          <Route path="/albums" element={<AlbumsView />} />
          <Route path="/albums/:id" element={<AlbumDetailView />} />
          <Route path="/artists" element={<ArtistsView />} />
          <Route path="/artists/:id" element={<ArtistDetailView />} />
          <Route path="/songs" element={<SongsView />} />
          <Route path="/playlists" element={<PlaylistsView />} />
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
    </BrowserRouter>
  )
}
