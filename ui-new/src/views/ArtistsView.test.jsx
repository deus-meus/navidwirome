import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ArtistsView from './ArtistsView'
import subsonic from '../api/subsonic'

describe('ArtistsView', () => {
  const mockArtistIndex = [
    {
      name: 'R',
      artist: [
        { id: 'art-1', name: 'Radiohead', albumCount: 9 },
        { id: 'art-2', name: 'Röyksopp', albumCount: 6 },
      ],
    },
    {
      name: 'S',
      artist: [{ id: 'art-3', name: 'Solar Echoes', albumCount: 3 }],
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(subsonic, 'getArtists').mockResolvedValue(mockArtistIndex)
  })

  it('renders index sections and artist cards', async () => {
    render(
      <MemoryRouter>
        <ArtistsView />
      </MemoryRouter>
    )

    expect(screen.getByText(/Artists Index/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Radiohead')).toBeInTheDocument()
      expect(screen.getByText('Röyksopp')).toBeInTheDocument()
      expect(screen.getByText('Solar Echoes')).toBeInTheDocument()
    })
  })
})
