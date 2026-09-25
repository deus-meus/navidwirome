import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PlaylistDetailView from './PlaylistDetailView'
import subsonic from '../api/subsonic'
import { usePlaylistStore } from '../store/usePlaylistStore'
import { useConfirmStore } from '../store/useConfirmStore'
import { useAuthStore } from '../store/useAuthStore'
import { nativeMusicApi } from '../api/nativeMusicApi'

describe('PlaylistDetailView', () => {
  const mockPlaylist = {
    id: 'pl-101',
    name: 'Lo-Fi Study Mix',
    owner: 'Admin',
    songCount: 2,
    duration: 360,
    public: false,
    entry: [
      { id: 's1', title: 'Rainy Night In Tokyo', artist: 'Nujabes', album: 'Modal Soul', duration: 180 },
      { id: 's2', title: 'Reflection Eternal', artist: 'Nujabes', album: 'Modal Soul', duration: 180 },
    ],
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({ user: { username: 'Admin', isAdmin: true } })
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
      expect(screen.getByRole('button', { name: /playlist options/i })).toBeInTheDocument()
    })
  })

  it('opens rename modal when clicking Rename menu item in three-dots menu', async () => {
    render(
      <MemoryRouter initialEntries={['/playlists/pl-101']}>
        <Routes>
          <Route path="/playlists/:id" element={<PlaylistDetailView />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /playlist options/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /playlist options/i }))
    expect(screen.getByRole('menuitem', { name: /rename playlist/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('menuitem', { name: /rename playlist/i }))
    expect(screen.getByText('Update collection title')).toBeInTheDocument()
  })

  it('triggers delete playlist with confirmation via three-dots menu', async () => {
    const deleteSpy = vi.spyOn(usePlaylistStore.getState(), 'deletePlaylist').mockResolvedValue(true)

    render(
      <MemoryRouter initialEntries={['/playlists/pl-101']}>
        <Routes>
          <Route path="/playlists/:id" element={<PlaylistDetailView />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /playlist options/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /playlist options/i }))
    expect(screen.getByRole('menuitem', { name: /delete playlist/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('menuitem', { name: /delete playlist/i }))
    expect(useConfirmStore.getState().isOpen).toBe(true)
    expect(useConfirmStore.getState().title).toBe('Delete Playlist')

    useConfirmStore.getState().handleConfirm()

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('pl-101', 'Lo-Fi Study Mix')
    })
  })

  it('triggers cover art upload when choosing an image file', async () => {
    const uploadSpy = vi.spyOn(nativeMusicApi, 'uploadPlaylistImage').mockResolvedValue(true)

    render(
      <MemoryRouter initialEntries={['/playlists/pl-101']}>
        <Routes>
          <Route path="/playlists/:id" element={<PlaylistDetailView />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/upload playlist cover file/i)).toBeInTheDocument()
    })

    const fileInput = screen.getByLabelText(/upload playlist cover file/i)
    const file = new File(['dummy-image'], 'cover.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith('pl-101', file)
    })
  })

  it('triggers reset cover art when confirmed', async () => {
    const deleteCoverSpy = vi.spyOn(nativeMusicApi, 'deletePlaylistImage').mockResolvedValue(true)

    render(
      <MemoryRouter initialEntries={['/playlists/pl-101']}>
        <Routes>
          <Route path="/playlists/:id" element={<PlaylistDetailView />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset cover/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /reset cover/i }))
    expect(useConfirmStore.getState().isOpen).toBe(true)
    expect(useConfirmStore.getState().title).toBe('Reset Cover Art')

    useConfirmStore.getState().handleConfirm()

    await waitFor(() => {
      expect(deleteCoverSpy).toHaveBeenCalledWith('pl-101')
    })
  })

  it('toggles playlist visibility between public and private via three-dots menu', async () => {
    const updatePublicSpy = vi.spyOn(subsonic, 'updatePlaylistPublic').mockResolvedValue(true)

    render(
      <MemoryRouter initialEntries={['/playlists/pl-101']}>
        <Routes>
          <Route path="/playlists/:id" element={<PlaylistDetailView />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /playlist options/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /playlist options/i }))
    expect(screen.getByRole('menuitem', { name: /set playlist to public/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('menuitem', { name: /set playlist to public/i }))

    await waitFor(() => {
      expect(updatePublicSpy).toHaveBeenCalledWith('pl-101', true)
    })
  })

  it('hides options menu, cover upload, and management actions for non-owner (even if admin)', async () => {
    // Current user is Admin, but playlist belongs to 'dwi'
    useAuthStore.setState({ user: { username: 'Admin', isAdmin: true } })
    vi.spyOn(subsonic, 'getPlaylist').mockResolvedValue({
      ...mockPlaylist,
      owner: 'dwi',
      public: true,
    })

    render(
      <MemoryRouter initialEntries={['/playlists/pl-101']}>
        <Routes>
          <Route path="/playlists/:id" element={<PlaylistDetailView />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Lo-Fi Study Mix').length).toBeGreaterThanOrEqual(1)
    })

    // Transport play & shuffle should be available
    expect(screen.getByRole('button', { name: /play all/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /shuffle/i })).toBeInTheDocument()

    // Mutation actions and options menu must NOT be rendered
    expect(screen.queryByRole('button', { name: /playlist options/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /upload cover/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reset cover/i })).not.toBeInTheDocument()
  })
})
