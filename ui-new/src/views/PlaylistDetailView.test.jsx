import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PlaylistDetailView from './PlaylistDetailView'
import subsonic from '../api/subsonic'
import { usePlaylistStore } from '../store/usePlaylistStore'

describe('PlaylistDetailView', () => {
  const mockPlaylist = {
    id: 'pl-101',
    name: 'Lo-Fi Study Mix',
    owner: 'Admin',
    songCount: 2,
    duration: 360,
    entry: [
      { id: 's1', title: 'Rainy Night In Tokyo', artist: 'Nujabes', album: 'Modal Soul', duration: 180 },
      { id: 's2', title: 'Reflection Eternal', artist: 'Nujabes', album: 'Modal Soul', duration: 180 },
    ],
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(subsonic, 'getPlaylist').mockResolvedValue(mockPlaylist)
  })

  it('renders playlist name, tracks, and action buttons', async () => {
    render(
      <MemoryRouter initialEntries={['/playlists/pl-101']}>
        <Routes>
          <Route path="/playlists/:id" element={<PlaylistDetailView />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Lo-Fi Study Mix').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Rainy Night In Tokyo')).toBeInTheDocument()
      expect(screen.getByText('Reflection Eternal')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /play all/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /shuffle/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /rename playlist/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete playlist/i })).toBeInTheDocument()
    })
  })

  it('opens rename modal when clicking Rename button', async () => {
    render(
      <MemoryRouter initialEntries={['/playlists/pl-101']}>
        <Routes>
          <Route path="/playlists/:id" element={<PlaylistDetailView />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /rename playlist/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /rename playlist/i }))
    expect(screen.getByText('Update collection title')).toBeInTheDocument()
  })

  it('triggers delete playlist with confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const deleteSpy = vi.spyOn(usePlaylistStore.getState(), 'deletePlaylist').mockResolvedValue(true)

    render(
      <MemoryRouter initialEntries={['/playlists/pl-101']}>
        <Routes>
          <Route path="/playlists/:id" element={<PlaylistDetailView />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete playlist/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /delete playlist/i }))
    expect(window.confirm).toHaveBeenCalled()
    expect(deleteSpy).toHaveBeenCalledWith('pl-101', 'Lo-Fi Study Mix')
  })
})
