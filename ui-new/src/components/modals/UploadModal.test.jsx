import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UploadModal from './UploadModal'

describe('UploadModal', () => {
  it('renders modal dialog when isOpen is true', () => {
    render(<UploadModal isOpen={true} onClose={() => {}} />)

    expect(screen.getByText(/Upload Audio & Batch Tagging/i)).toBeInTheDocument()
    expect(screen.getByText(/Drag & drop master audio files here/i)).toBeInTheDocument()
    expect(screen.getByText(/Browse Local Storage/i)).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(<UploadModal isOpen={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('triggers file selection when uploading a file', () => {
    render(<UploadModal isOpen={true} onClose={() => {}} />)

    const file = new File(['audio dummy data'], 'test_track.flac', { type: 'audio/flac' })
    const input = screen.getByTestId('file-upload-input')

    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByText('test_track.flac')).toBeInTheDocument()
    expect(screen.getByText(/Ready to Upload/i)).toBeInTheDocument()
  })

  it('calls onClose when clicking Cancel or Close button', () => {
    const handleClose = vi.fn()
    render(<UploadModal isOpen={true} onClose={handleClose} />)

    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelBtn)
    expect(handleClose).toHaveBeenCalled()
  })

  it('uploads selected files using nativeMusicApi and fires onUploadComplete', async () => {
    const { nativeMusicApi } = await import('../../api/nativeMusicApi')
    const uploadSpy = vi.spyOn(nativeMusicApi, 'uploadMusicFile').mockResolvedValue({ success: true })
    const handleComplete = vi.fn()
    const handleClose = vi.fn()

    render(<UploadModal isOpen={true} onClose={handleClose} onUploadComplete={handleComplete} />)

    const file = new File(['audio dummy data'], 'test_track.flac', { type: 'audio/flac' })
    const input = screen.getByTestId('file-upload-input')
    fireEvent.change(input, { target: { files: [file] } })

    const commitBtn = screen.getByRole('button', { name: /commit to library/i })
    fireEvent.click(commitBtn)

    await vi.waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(file)
      expect(handleComplete).toHaveBeenCalled()
    })
  })
})
