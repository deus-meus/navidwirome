import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ArtistDetailView from './ArtistDetailView'
import subsonic from '../api/subsonic'

describe('ArtistDetailView', () => {
  const mockArtist = {
    id: 'art-1',
    name: 'Radiohead',
    album: [
      { id: 'al-1', name: 'Kid A', year: 2000, suffix: 'flac' },
      { id: 'al-2', name: 'In Rainbows', year: 2007, suffix: 'flac' },
    ],
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(subsonic, 'getArtist').mockResolvedValue(mockArtist)
  })

  it('renders artist profile and discography albums', async () => {
    render(
      <MemoryRouter initialEntries={['/artists/art-1']}>
        <Routes>
          <Route path="/artists/:id" element={<ArtistDetailView />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Radiohead').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Kid A')).toBeInTheDocument()
      expect(screen.getByText('In Rainbows')).toBeInTheDocument()
    })
  })
})
