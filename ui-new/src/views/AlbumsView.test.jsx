import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AlbumsView from './AlbumsView'
import subsonic from '../api/subsonic'

describe('AlbumsView', () => {
  const mockAlbums = [
    { id: 'al-1', name: 'Kid A', artist: 'Radiohead', year: 2000, suffix: 'flac' },
    { id: 'al-2', name: 'In Rainbows', artist: 'Radiohead', year: 2007, suffix: 'alac' },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(subsonic, 'getAlbumList2').mockResolvedValue(mockAlbums)
  })

  it('renders albums header and album items from Subsonic', async () => {
    render(
      <MemoryRouter>
        <AlbumsView />
      </MemoryRouter>
    )

    expect(screen.getByText(/Albums Catalog/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(subsonic.getAlbumList2).toHaveBeenCalledWith('newest', 50)
      expect(screen.getByText('Kid A')).toBeInTheDocument()
      expect(screen.getByText('In Rainbows')).toBeInTheDocument()
    })
  })

  it('changes album sort type when clicking filter tabs', async () => {
    render(
      <MemoryRouter>
        <AlbumsView />
      </MemoryRouter>
    )

    const mostPlayedTab = screen.getByRole('button', { name: /most played/i })
    fireEvent.click(mostPlayedTab)

    await waitFor(() => {
      expect(subsonic.getAlbumList2).toHaveBeenCalledWith('frequent', expect.any(Number))
    })
  })
})
