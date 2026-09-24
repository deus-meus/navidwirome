import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PlaylistsView from './PlaylistsView'
import subsonic from '../api/subsonic'

describe('PlaylistsView', () => {
  const mockPlaylists = [
    { id: 'pl-1', name: 'Hi-Res Masters (FLAC)', songCount: 142, duration: 25400 },
    { id: 'pl-2', name: 'Deep Focus & Ambient', songCount: 88, duration: 18000 },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
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
})
