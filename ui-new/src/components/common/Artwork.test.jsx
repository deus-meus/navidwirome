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

  it('renders fallback vinyl placeholder on image load failure', () => {
    vi.spyOn(subsonic, 'getCoverArtUrl').mockReturnValue('http://invalid-art')

    render(<Artwork record={{ id: '1' }} alt="Cover" />)
    const img = screen.getByRole('img', { name: 'Cover' })

    fireEvent.error(img)

    expect(screen.getByTestId('artwork-placeholder')).toBeInTheDocument()
  })
})
