import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AlbumDetailView from './AlbumDetailView'
import subsonic from '../api/subsonic'
import { useAuthStore } from '../store/useAuthStore'
import { useConfirmStore } from '../store/useConfirmStore'

describe('AlbumDetailView', () => {
  const mockAlbum = {
    id: 'alb-101',
    name: 'Acoustic Resonance Vol. IV',
    artist: 'Solar Echoes',
    artistId: 'art-202',
    year: 2024,
    genre: 'Ambient Neo-Classical',
    songCount: 2,
    duration: 520,
    song: [
      { id: 's1', title: 'Part I: Harmonic Descent', artist: 'Solar Echoes', album: 'Acoustic Resonance Vol. IV', duration: 260, track: 1 },
      { id: 's2', title: 'Part II: Resonant Echoes', artist: 'Solar Echoes', album: 'Acoustic Resonance Vol. IV', duration: 260, track: 2 },
    ],
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(subsonic, 'getAlbum').mockResolvedValue(mockAlbum)
    useAuthStore.setState({
      user: { id: 'u1', username: 'admin', isAdmin: true },
    })
  })

  it('fetches album details by route id and renders tracks', async () => {
    render(
      <MemoryRouter initialEntries={['/albums/alb-101']}>
        <Routes>
          <Route path="/albums/:id" element={<AlbumDetailView />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Acoustic Resonance Vol. IV').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/Solar Echoes/).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Part I: Harmonic Descent')).toBeInTheDocument()
      expect(screen.getByText('Part II: Resonant Echoes')).toBeInTheDocument()
    })
  })

  it('renders Play All, Shuffle, and Delete actions for admin', async () => {
    render(
      <MemoryRouter initialEntries={['/albums/alb-101']}>
        <Routes>
          <Route path="/albums/:id" element={<AlbumDetailView />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play all/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /shuffle/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete album/i })).toBeInTheDocument()
    })
  })

  it('hides delete album button for non-admin user', async () => {
    useAuthStore.setState({
      user: { id: 'u2', username: 'listener', isAdmin: false },
    })

    render(
      <MemoryRouter initialEntries={['/albums/alb-101']}>
        <Routes>
          <Route path="/albums/:id" element={<AlbumDetailView />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play all/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /shuffle/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /delete album/i })).not.toBeInTheDocument()
    })
  })

  it('triggers delete album with confirmation', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true })

    render(
      <MemoryRouter initialEntries={['/albums/alb-101']}>
        <Routes>
          <Route path="/albums/:id" element={<AlbumDetailView />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete album/i })).toBeInTheDocument()
    })

    const deleteBtn = screen.getByRole('button', { name: /delete album/i })
    deleteBtn.click()

    expect(useConfirmStore.getState().isOpen).toBe(true)
    expect(useConfirmStore.getState().title).toBe('Delete Album')

    useConfirmStore.getState().handleConfirm()

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/music/album/alb-101', { method: 'DELETE' })
    })
  })
})
