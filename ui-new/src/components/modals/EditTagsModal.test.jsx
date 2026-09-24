import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EditTagsModal from './EditTagsModal'
import { nativeMusicApi } from '../../api/nativeMusicApi'
import { useToastStore } from '../../store/useToastStore'

vi.mock('../../api/nativeMusicApi', () => ({
  nativeMusicApi: {
    updateTrackTags: vi.fn(),
  },
}))

describe('EditTagsModal', () => {
  const mockTrack = {
    id: 'track-1',
    title: 'Ombak Banyu Asmara',
    artist: 'The Panturas',
    album: 'Ombak Banyu Asmara',
    year: 2021,
    genre: 'Surf Rock',
    track: 3,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useToastStore.setState({ toasts: [] })
  })

  it('renders nothing when isOpen is false or track is null', () => {
    const { container, rerender } = render(
      <EditTagsModal isOpen={false} track={mockTrack} onClose={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()

    rerender(<EditTagsModal isOpen={true} track={null} onClose={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders metadata form fields with initial track data', () => {
    render(<EditTagsModal isOpen={true} track={mockTrack} onClose={vi.fn()} />)

    expect(screen.getByRole('heading', { name: /edit audio metadata/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/track title/i)).toHaveValue('Ombak Banyu Asmara')
    expect(screen.getByLabelText(/artist/i)).toHaveValue('The Panturas')
    expect(screen.getByLabelText(/album/i)).toHaveValue('Ombak Banyu Asmara')
    expect(screen.getByLabelText(/year/i)).toHaveValue(2021)
    expect(screen.getByLabelText(/genre/i)).toHaveValue('Surf Rock')
    expect(screen.getByLabelText(/track number/i)).toHaveValue(3)
  })

  it('submits updated tags and displays success toast', async () => {
    nativeMusicApi.updateTrackTags.mockResolvedValueOnce({
      success: true,
      track: { ...mockTrack, title: 'Updated Title' },
    })
    const handleClose = vi.fn()
    const handleSuccess = vi.fn()

    render(
      <EditTagsModal
        isOpen={true}
        track={mockTrack}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    )

    fireEvent.change(screen.getByLabelText(/track title/i), {
      target: { value: 'Updated Title' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save metadata/i }))

    await waitFor(() => {
      expect(nativeMusicApi.updateTrackTags).toHaveBeenCalledWith('track-1', {
        title: 'Updated Title',
        artist: 'The Panturas',
        album: 'Ombak Banyu Asmara',
        year: '2021',
        genre: 'Surf Rock',
        trackNumber: '3',
      })
    })

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled()
      expect(handleSuccess).toHaveBeenCalled()
      expect(useToastStore.getState().toasts.length).toBeGreaterThan(0)
    })
  })

  it('handles submission errors gracefully', async () => {
    nativeMusicApi.updateTrackTags.mockRejectedValueOnce(new Error('Permission denied'))
    const handleClose = vi.fn()

    render(<EditTagsModal isOpen={true} track={mockTrack} onClose={handleClose} />)

    fireEvent.click(screen.getByRole('button', { name: /save metadata/i }))

    await waitFor(() => {
      expect(screen.getByText(/permission denied/i)).toBeInTheDocument()
      expect(handleClose).not.toHaveBeenCalled()
    })
  })

  it('closes on cancel button click', () => {
    const handleClose = vi.fn()
    render(<EditTagsModal isOpen={true} track={mockTrack} onClose={handleClose} />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(handleClose).toHaveBeenCalled()
  })
})
