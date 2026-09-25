import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PlaylistsView from './PlaylistsView'
import subsonic from '../api/subsonic'
import { useAuthStore } from '../store/useAuthStore'

describe('PlaylistsView', () => {
  const mockPlaylists = [
    { id: 'pl-1', name: 'Hi-Res Masters (FLAC)', owner: 'Admin', songCount: 142, duration: 25400 },
    { id: 'pl-2', name: 'Deep Focus & Ambient', owner: 'dwi', songCount: 88, duration: 18000 },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({ user: { username: 'Admin', isAdmin: true } })
    vi.spyOn(subsonic, 'getPlaylists').mockResolvedValue(mockPlaylists)
  })

  it('renders playlists header and user playlists', async () => {
    render(
      <MemoryRouter>
        <PlaylistsView />
      </MemoryRouter>
    )

    expect(screen.getByText(/User Playlists/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Hi-Res Masters (FLAC)')).toBeInTheDocument()
      expect(screen.getByText('Deep Focus & Ambient')).toBeInTheDocument()
    })
  })

  it('renders create playlist button and handles creation', async () => {
    vi.spyOn(subsonic, 'getPlaylists').mockResolvedValue([])
    render(
      <MemoryRouter>
        <PlaylistsView />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /create playlist/i }).length).toBeGreaterThan(0)
    })
  })

  it('restricts card rename and delete actions for non-owner playlists', async () => {
    useAuthStore.setState({ user: { username: 'dwi', isAdmin: false } })
    render(
      <MemoryRouter>
        <PlaylistsView />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Hi-Res Masters (FLAC)')).toBeInTheDocument()
    })

    // Non-owner (Admin's playlist) should NOT have mutation buttons for dwi
    expect(screen.queryByRole('button', { name: /rename Hi-Res Masters \(FLAC\)/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete Hi-Res Masters \(FLAC\)/i })).not.toBeInTheDocument()

    // Owned playlist (dwi's playlist) SHOULD have mutation buttons
    expect(screen.getByRole('button', { name: /rename Deep Focus & Ambient/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete Deep Focus & Ambient/i })).toBeInTheDocument()
  })
})
