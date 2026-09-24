import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SearchModal from './SearchModal'
import subsonic from '../../api/subsonic'

describe('SearchModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders search input when open is true', () => {
    render(<SearchModal isOpen={true} onClose={() => {}} />)
    expect(screen.getByPlaceholderText(/search catalog/i)).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(<SearchModal isOpen={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('searches Subsonic API and renders grouped results', async () => {
    vi.spyOn(subsonic, 'search3').mockResolvedValue({
      artists: [{ id: 'ar1', name: 'Radiohead' }],
      albums: [{ id: 'al1', name: 'Kid A', artist: 'Radiohead' }],
      songs: [{ id: 's1', title: 'Everything In Its Right Place', artist: 'Radiohead', duration: 251 }],
    })

    render(<SearchModal isOpen={true} onClose={() => {}} onSelectTrack={() => {}} />)

    const input = screen.getByPlaceholderText(/search catalog/i)
    fireEvent.change(input, { target: { value: 'Radiohead' } })

    await waitFor(() => {
      expect(screen.getByText('Artists')).toBeInTheDocument()
      expect(screen.getAllByText('Radiohead').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Albums')).toBeInTheDocument()
      expect(screen.getByText('Kid A')).toBeInTheDocument()
      expect(screen.getByText('Songs')).toBeInTheDocument()
      expect(screen.getByText('Everything In Its Right Place')).toBeInTheDocument()
    })
  })

  it('calls onClose when clicking close button or pressing Escape', () => {
    const handleClose = vi.fn()
    render(<SearchModal isOpen={true} onClose={handleClose} />)

    const closeBtn = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalled()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(2)
  })
})
