import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UploaderDialog } from './UploaderDialog'

const mockNotify = vi.fn()
const mockTranslate = vi.fn((key) => key)

vi.mock('react-admin', () => ({
  useNotify: () => mockNotify,
  useTranslate: () => mockTranslate,
}))

describe('<UploaderDialog />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('token', 'fake-jwt-token')
    global.fetch = vi.fn()
  })

  it('renders upload dialog when open', () => {
    render(<UploaderDialog open={true} onClose={vi.fn()} />)

    expect(screen.getByText('resources.upload.title')).toBeInTheDocument()
    expect(screen.getByTestId('uploader-dropzone')).toBeInTheDocument()
    expect(screen.getByTestId('auto-identify-checkbox')).toBeInTheDocument()
    expect(screen.getByTestId('upload-submit-button')).toBeDisabled()
  })

  it('enables upload button when files are selected', () => {
    render(<UploaderDialog open={true} onClose={vi.fn()} />)

    const fileInput = screen.getByTestId('file-input')
    const file = new File(['dummy audio content'], 'song.mp3', {
      type: 'audio/mpeg',
    })

    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(screen.getByText('song.mp3')).toBeInTheDocument()
    expect(screen.getByTestId('upload-submit-button')).not.toBeDisabled()
  })

  it('uploads selected files and calls onClose on success', async () => {
    const handleClose = vi.fn()
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', file: 'song.mp3' }),
    })

    render(<UploaderDialog open={true} onClose={handleClose} />)

    const fileInput = screen.getByTestId('file-input')
    const file = new File(['dummy audio content'], 'song.mp3', {
      type: 'audio/mpeg',
    })

    fireEvent.change(fileInput, { target: { files: [file] } })
    fireEvent.click(screen.getByTestId('upload-submit-button'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/music/upload'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-nd-authorization': 'Bearer fake-jwt-token',
          }),
        }),
      )
    })

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(
        'resources.upload.notifications.success',
        'info',
      )
      expect(handleClose).toHaveBeenCalled()
    })
  })

  it('notifies error when upload fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Upload failed' }),
    })

    render(<UploaderDialog open={true} onClose={vi.fn()} />)

    const fileInput = screen.getByTestId('file-input')
    const file = new File(['dummy audio content'], 'song.mp3', {
      type: 'audio/mpeg',
    })

    fireEvent.change(fileInput, { target: { files: [file] } })
    fireEvent.click(screen.getByTestId('upload-submit-button'))

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(
        'resources.upload.notifications.error',
        'warning',
      )
    })
  })
})
