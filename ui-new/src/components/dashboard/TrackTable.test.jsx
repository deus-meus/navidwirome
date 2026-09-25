import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TrackTable from './TrackTable'
import { useAuthStore } from '../../store/useAuthStore'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useUIStore } from '../../store/useUIStore'
import { useConfirmStore } from '../../store/useConfirmStore'

describe('TrackTable', () => {
  const mockTracks = [
    {
      id: 's1',
      title: 'Obscure Gesture',
      artist: 'Burnt Friedman',
      album: 'Secret Rhythms',
      duration: 274, // 4:34
      bitRate: 920,
      suffix: 'flac',
      starred: false,
    },
    {
      id: 's2',
      title: 'Solar Drift',
      artist: 'Solar Echoes',
      album: 'Drift EP',
      duration: 185, // 3:05
      bitRate: 320,
      suffix: 'mp3',
      starred: true,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: { id: 'u1', username: 'admin', isAdmin: true, canEditTags: true },
    })
    usePlayerStore.setState({
      queue: [],
      queueIndex: -1,
      currentTrack: null,
      isPlaying: false,
    })
    useUIStore.setState({
      tagEditorTrack: null,
    })
  })

  it('renders track headers and all track rows', () => {
    render(<TrackTable tracks={mockTracks} />)

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Album')).toBeInTheDocument()
    expect(screen.getByText('Obscure Gesture')).toBeInTheDocument()
    expect(screen.getByText('Burnt Friedman')).toBeInTheDocument()
    expect(screen.getByText('Secret Rhythms')).toBeInTheDocument()
    expect(screen.getByText('4:34')).toBeInTheDocument()

    expect(screen.getByText('Solar Drift')).toBeInTheDocument()
    expect(screen.getByText('3:05')).toBeInTheDocument()
  })

  it('renders active EqualizerBars when a track is currently playing', () => {
    render(
      <TrackTable
        tracks={mockTracks}
        currentTrack={mockTracks[0]}
        isPlaying={true}
      />
    )

    expect(screen.getByTestId('equalizer-bars')).toBeInTheDocument()
  })

  it('calls onPlayTrack with selected track and queue when clicked', () => {
    const handlePlay = vi.fn()
    render(<TrackTable tracks={mockTracks} onPlayTrack={handlePlay} />)

    const row = screen.getByText('Obscure Gesture')
    fireEvent.click(row)
    expect(handlePlay).toHaveBeenCalledWith(mockTracks[0], mockTracks)
  })

  it('triggers onToggleStar when clicking the favorite heart button', () => {
    const handleStar = vi.fn()
    render(<TrackTable tracks={mockTracks} onToggleStar={handleStar} />)

    const starBtns = screen.getAllByRole('button', { name: /favorite/i })
    fireEvent.click(starBtns[0])
    expect(handleStar).toHaveBeenCalledWith(mockTracks[0])
  })

  it('triggers onEditTags when clicking the edit track tags button', () => {
    const handleEdit = vi.fn()
    render(<TrackTable tracks={mockTracks} onEditTags={handleEdit} />)

    const editBtns = screen.getAllByRole('button', { name: /edit track tags/i })
    fireEvent.click(editBtns[0])
    expect(handleEdit).toHaveBeenCalledWith(mockTracks[0])
  })

  it('opens tag editor in useUIStore when clicking edit button without onEditTags prop', () => {
    render(<TrackTable tracks={mockTracks} />)

    const editBtns = screen.getAllByRole('button', { name: /edit track tags/i })
    fireEvent.click(editBtns[0])
    expect(useUIStore.getState().tagEditorTrack).toEqual(mockTracks[0])
  })

  it('shows edit tags button when user has canEditTags permission even if not admin', () => {
    useAuthStore.setState({
      user: { id: 'u2', username: 'editor', isAdmin: false, canEditTags: true },
    })
    render(<TrackTable tracks={mockTracks} />)

    expect(screen.getAllByRole('button', { name: /edit track tags/i }).length).toBe(2)
    // Non-admin should NOT see delete button
    expect(screen.queryByRole('button', { name: /delete track/i })).not.toBeInTheDocument()
  })

  it('hides edit tags and delete buttons when user has standard listener permissions', () => {
    useAuthStore.setState({
      user: { id: 'u3', username: 'listener', isAdmin: false, canEditTags: false },
    })
    render(<TrackTable tracks={mockTracks} />)

    expect(screen.queryByRole('button', { name: /edit track tags/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete track/i })).not.toBeInTheDocument()
  })

  it('triggers addToQueue when clicking add to queue button without duplicate toast', () => {
    const addToQueueSpy = vi.spyOn(usePlayerStore.getState(), 'addToQueue')
    render(<TrackTable tracks={mockTracks} />)

    const queueBtns = screen.getAllByRole('button', { name: /add to queue/i })
    fireEvent.click(queueBtns[0])
    expect(addToQueueSpy).toHaveBeenCalledWith(mockTracks[0])
  })

  it('triggers onDeleteTrack after confirming via useConfirmStore', async () => {
    const handleDeleteTrack = vi.fn()
    render(<TrackTable tracks={mockTracks} onDeleteTrack={handleDeleteTrack} />)

    const deleteBtns = screen.getAllByRole('button', { name: /delete track/i })
    fireEvent.click(deleteBtns[0])

    expect(useConfirmStore.getState().isOpen).toBe(true)
    expect(useConfirmStore.getState().title).toBe('Delete Track')

    useConfirmStore.getState().handleConfirm()
    await waitFor(() => {
      expect(handleDeleteTrack).toHaveBeenCalledWith(mockTracks[0])
    })
  })
})
