import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import SongsView from './SongsView'
import subsonic from '../api/subsonic'

describe('SongsView', () => {
  const mockSongs = [
    { id: 's1', title: 'Kid A', artist: 'Radiohead', album: 'Kid A', duration: 284 },
    { id: 's2', title: 'Idioteque', artist: 'Radiohead', album: 'Kid A', duration: 309 },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(subsonic, 'getRandomSongs').mockResolvedValue(mockSongs)
  })

  it('renders songs library and track table', async () => {
    render(<SongsView />)

    expect(screen.getByText(/Songs Library/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getAllByText('Kid A').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Idioteque')).toBeInTheDocument()
    })
  })
})
