import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AlbumGrid from './AlbumGrid'

describe('AlbumGrid', () => {
  const mockAlbums = [
    {
      id: 'alb-1',
      name: 'Spaces',
      artist: 'Nils Frahm',
      year: 2013,
      suffix: 'flac',
    },
    {
      id: 'alb-2',
      name: 'Crush',
      artist: 'Floating Points',
      year: 2019,
      suffix: 'alac',
    },
  ]

  it('renders section title, subtitle, and album items', () => {
    render(
      <AlbumGrid
        title="Recent Albums"
        subtitle="Hi-Res catalog additions"
        albums={mockAlbums}
      />
    )

    expect(screen.getByText('Recent Albums')).toBeInTheDocument()
    expect(screen.getByText('Hi-Res catalog additions')).toBeInTheDocument()
    expect(screen.getByText('Spaces')).toBeInTheDocument()
    expect(screen.getByText('Nils Frahm')).toBeInTheDocument()
    expect(screen.getByText('Crush')).toBeInTheDocument()
    expect(screen.getByText('Floating Points')).toBeInTheDocument()
  })

  it('triggers onPlayAlbum when clicking the play action button', () => {
    const handlePlay = vi.fn()
    render(<AlbumGrid albums={mockAlbums} onPlayAlbum={handlePlay} />)

    const playBtns = screen.getAllByRole('button', { name: /play/i })
    expect(playBtns.length).toBeGreaterThan(0)
    fireEvent.click(playBtns[0])
    expect(handlePlay).toHaveBeenCalledWith(mockAlbums[0])
  })

  it('triggers onSelectAlbum when clicking an album card', () => {
    const handleSelect = vi.fn()
    render(<AlbumGrid albums={mockAlbums} onSelectAlbum={handleSelect} />)

    const albumTitle = screen.getByText('Spaces')
    fireEvent.click(albumTitle)
    expect(handleSelect).toHaveBeenCalledWith(mockAlbums[0])
  })
})
