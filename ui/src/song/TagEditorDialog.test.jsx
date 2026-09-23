import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TagEditorDialog } from './TagEditorDialog'

const mockNotify = vi.fn()
const mockTranslate = vi.fn((key) => key)

vi.mock('react-admin', () => ({
  useNotify: () => mockNotify,
  useTranslate: () => mockTranslate,
}))

describe('<TagEditorDialog />', () => {
  const dummySong = {
    id: 'song-123',
    title: 'Original Title',
    artist: 'Original Artist',
    album: 'Original Album',
    albumArtist: 'Original Album Artist',
    trackNumber: 1,
    year: 2024,
    genre: 'Rock',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('token', 'fake-jwt-token')
    global.fetch = vi.fn()
  })

  it('renders dialog with track metadata pre-populated', () => {
    render(
      <TagEditorDialog open={true} record={dummySong} onClose={vi.fn()} />,
    )

    expect(screen.getByText('resources.song.tagEditor.title')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Original Artist')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Original Album')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Rock')).toBeInTheDocument()
  })

  it('auto-detects tags and updates fields on identify click', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        title: 'Detected Title',
        artist: 'Detected Artist',
        album: 'Detected Album',
        year: 2026,
        genre: 'Electronic',
      }),
    })

    render(
      <TagEditorDialog open={true} record={dummySong} onClose={vi.fn()} />,
    )

    fireEvent.click(screen.getByTestId('auto-detect-button'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/music/identify'),
        expect.anything(),
      )
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Detected Title')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Detected Artist')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Detected Album')).toBeInTheDocument()
    })
  })

  it('submits updated tags to backend and closes on save success', async () => {
    const handleClose = vi.fn()
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    })

    render(
      <TagEditorDialog open={true} record={dummySong} onClose={handleClose} />,
    )

    fireEvent.change(screen.getByDisplayValue('Original Title'), {
      target: { value: 'Updated Title' },
    })

    fireEvent.click(screen.getByTestId('save-tags-button'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/music/track/song-123/tags'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-nd-authorization': 'Bearer fake-jwt-token',
          }),
          body: expect.stringContaining('Updated Title'),
        }),
      )
    })

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(
        'resources.song.notifications.tagsUpdated',
        'info',
      )
      expect(handleClose).toHaveBeenCalled()
    })
  })

  it('notifies error when tag update fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Update failed' }),
    })

    render(
      <TagEditorDialog open={true} record={dummySong} onClose={vi.fn()} />,
    )

    fireEvent.click(screen.getByTestId('save-tags-button'))

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(
        'resources.song.notifications.tagsUpdateError',
        'warning',
      )
    })
  })
})
