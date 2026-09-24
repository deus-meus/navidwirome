import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TagEditorModal from './TagEditorModal'

describe('TagEditorModal', () => {
  const mockTrack = {
    id: 's1',
    title: 'Obscure Gesture',
    artist: 'Burnt Friedman',
    album: 'Secret Rhythms',
    year: 2002,
    genre: 'Krautrock',
    track: 1,
  }

  it('renders modal with prefilled track metadata fields', () => {
    render(<TagEditorModal isOpen={true} track={mockTrack} onClose={() => {}} />)

    expect(screen.getByText(/Audio Tag & Metadata Editor/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Obscure Gesture')).toBeInTheDocument()
    expect(screen.getAllByDisplayValue('Burnt Friedman').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByDisplayValue('Secret Rhythms')).toBeInTheDocument()
  })

  it('calls onSaveTags with modified metadata when clicking Save', () => {
    const handleSave = vi.fn()
    render(<TagEditorModal isOpen={true} track={mockTrack} onClose={() => {}} onSaveTags={handleSave} />)

    const titleInput = screen.getByDisplayValue('Obscure Gesture')
    fireEvent.change(titleInput, { target: { value: 'Obscure Gesture (Remastered)' } })

    const saveBtn = screen.getByRole('button', { name: /save metadata/i })
    fireEvent.click(saveBtn)

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Obscure Gesture (Remastered)',
      })
    )
  })
})
