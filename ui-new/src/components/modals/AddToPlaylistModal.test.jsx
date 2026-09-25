import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddToPlaylistModal from './AddToPlaylistModal'
import subsonic from '../../api/subsonic'
import { useAuthStore } from '../../store/useAuthStore'

describe('AddToPlaylistModal', () => {
  const mockTrack = {
    id: 's1',
    title: 'Surfin Ten',
    artist: 'The Panturas',
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({ user: { username: 'Admin', isAdmin: true } })
    vi.spyOn(subsonic, 'getPlaylists').mockResolvedValue([
      { id: 'pl-1', name: 'Road Trip', owner: 'Admin', songCount: 5 },
      { id: 'pl-2', name: 'Late Night', owner: 'Admin', songCount: 12 },
    ])
    vi.spyOn(subsonic, 'addToPlaylist').mockResolvedValue(true)
    vi.spyOn(subsonic, 'createPlaylist').mockResolvedValue({ id: 'pl-new', name: 'Surf Vibes' })
  })

  it('renders track title and existing playlists owned by user when open', async () => {
    render(<AddToPlaylistModal isOpen={true} track={mockTrack} onClose={() => {}} />)

    expect(screen.getByText(/Add to Playlist/i)).toBeInTheDocument()
    expect(screen.getByText(/Surfin Ten/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Road Trip')).toBeInTheDocument()
      expect(screen.getByText('Late Night')).toBeInTheDocument()
    })
  })

  it('filters out playlists owned by other users', async () => {
    vi.spyOn(subsonic, 'getPlaylists').mockResolvedValue([
      { id: 'pl-1', name: 'Road Trip', owner: 'Admin', songCount: 5 },
      { id: 'pl-2', name: 'Dwi Mixtape', owner: 'dwi', songCount: 12 },
    ])

    render(<AddToPlaylistModal isOpen={true} track={mockTrack} onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText('Road Trip')).toBeInTheDocument()
      expect(screen.queryByText('Dwi Mixtape')).not.toBeInTheDocument()
    })
  })

  it('calls addToPlaylist when clicking an existing playlist', async () => {
    const handleClose = vi.fn()
    render(<AddToPlaylistModal isOpen={true} track={mockTrack} onClose={handleClose} />)

    await waitFor(() => {
      expect(screen.getByText('Road Trip')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Road Trip'))

    await waitFor(() => {
      expect(subsonic.addToPlaylist).toHaveBeenCalledWith('pl-1', 's1')
      expect(handleClose).toHaveBeenCalled()
    })
  })

  it('creates new playlist and adds track when entering new playlist name', async () => {
    const handleClose = vi.fn()
    render(<AddToPlaylistModal isOpen={true} track={mockTrack} onClose={handleClose} />)

    const input = screen.getByPlaceholderText(/new playlist name/i)
    fireEvent.change(input, { target: { value: 'Surf Vibes' } })

    const createBtn = screen.getByRole('button', { name: /create & add/i })
    fireEvent.click(createBtn)

    await waitFor(() => {
      expect(subsonic.createPlaylist).toHaveBeenCalledWith(null, 'Surf Vibes', ['s1'])
      expect(handleClose).toHaveBeenCalled()
    })
  })
})
