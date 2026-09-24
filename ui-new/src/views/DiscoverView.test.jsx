import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import DiscoverView from './DiscoverView'
import subsonic from '../api/subsonic'

describe('DiscoverView', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(subsonic, 'getAlbumList2').mockResolvedValue([
      { id: 'alb-1', name: 'Flown', artist: 'Kiasmos', year: 2024 },
      { id: 'alb-2', name: 'Spaces', artist: 'Nils Frahm', year: 2013 },
    ])
    vi.spyOn(subsonic, 'getRandomSongs').mockResolvedValue([
      { id: 's1', title: 'Obscure Gesture', artist: 'Burnt Friedman', album: 'Secret Rhythms', duration: 274 },
    ])
  })

  it('renders all sections: Quick Access, Hero Master, Recent Acquisitions, and Tracklist', async () => {
    render(
      <BrowserRouter>
        <DiscoverView />
      </BrowserRouter>
    )

    // Quick Access
    expect(screen.getByText('Quick Access')).toBeInTheDocument()

    // Wait for async Subsonic queries
    await waitFor(() => {
      // Hero Master
      expect(screen.getByText('Master Feature')).toBeInTheDocument()
      // Recent Albums
      expect(screen.getByText('Recent Albums & Acquisitions')).toBeInTheDocument()
      // Track Table
      expect(screen.getByText(/Audio Stream Queue/i)).toBeInTheDocument()
    })
  })
})
