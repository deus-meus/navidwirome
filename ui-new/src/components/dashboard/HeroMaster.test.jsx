import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HeroMaster from './HeroMaster'

describe('HeroMaster', () => {
  const mockAlbum = {
    id: 'alb-flown',
    name: 'Flown',
    artist: 'Kiasmos',
    year: 2024,
    genre: 'Minimal Techno',
  }

  it('renders album information, format badge, and audio spectrum', () => {
    render(<HeroMaster album={mockAlbum} />)

    expect(screen.getByText('Master Feature')).toBeInTheDocument()
    expect(screen.getByText('Flown')).toBeInTheDocument()
    expect(screen.getByText(/Kiasmos/)).toBeInTheDocument()
    expect(screen.getByText(/24-bit \/ 96kHz Lossless/i)).toBeInTheDocument()
    expect(screen.getByText('Spectrum Density')).toBeInTheDocument()
    expect(screen.getByText(/DR16/i)).toBeInTheDocument()
  })

  it('triggers onPlayMaster callback when clicking Play Master button', () => {
    const handlePlay = vi.fn()
    render(<HeroMaster album={mockAlbum} onPlayMaster={handlePlay} />)

    const playBtn = screen.getByRole('button', { name: /play master/i })
    fireEvent.click(playBtn)
    expect(handlePlay).toHaveBeenCalledWith(mockAlbum)
  })
})
