import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Artwork from './Artwork'
import subsonic from '../../api/subsonic'

describe('Artwork component', () => {
  it('renders image with defensive Subsonic artwork URL', () => {
    vi.spyOn(subsonic, 'getCoverArtUrl').mockReturnValue('http://localhost:3000/rest/getCoverArt?id=al-1')

    render(<Artwork record={{ id: '1', albumArtist: 'Artist' }} size={120} alt="Cover" />)
    const img = screen.getByRole('img', { name: 'Cover' })
    expect(img).toHaveAttribute('src', 'http://localhost:3000/rest/getCoverArt?id=al-1')
  })

  it('renders fallback placeholder on image load failure', () => {
    vi.spyOn(subsonic, 'getCoverArtUrl').mockReturnValue('http://invalid-art')

    render(<Artwork record={{ id: '1' }} alt="Cover" />)
    const img = screen.getByRole('img', { name: 'Cover' })

    fireEvent.error(img)

    expect(screen.getByTestId('artwork-placeholder')).toBeInTheDocument()
  })

  it('renders styled default playlist artwork for playlist records on error', () => {
    vi.spyOn(subsonic, 'getCoverArtUrl').mockReturnValue('http://invalid-playlist-art')

    render(<Artwork record={{ id: 'pl-1', sync: true }} alt="Playlist Cover" />)
    const img = screen.getByRole('img', { name: 'Playlist Cover' })
    fireEvent.error(img)

    expect(screen.getByTestId('artwork-placeholder')).toBeInTheDocument()
    expect(screen.getByText('PLAYLIST')).toBeInTheDocument()
  })

  it('renders track mosaic when fallbackTracks are provided and cover fails', () => {
    vi.spyOn(subsonic, 'getCoverArtUrl').mockReturnValueOnce('http://invalid-playlist-art')

    const mockTracks = [
      { id: 't1', albumId: 'a1' },
      { id: 't2', albumId: 'a2' },
      { id: 't3', albumId: 'a3' },
      { id: 't4', albumId: 'a4' },
    ]

    render(<Artwork record={{ id: 'pl-1', sync: true, fallbackTracks: mockTracks }} alt="Playlist Cover" />)
    const img = screen.getByRole('img', { name: 'Playlist Cover' })
    fireEvent.error(img)

    expect(screen.getByTestId('artwork-placeholder')).toBeInTheDocument()
  })
})
