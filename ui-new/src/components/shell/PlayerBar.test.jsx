import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PlayerBar from './PlayerBar'
import { usePlayerStore } from '../../store/usePlayerStore'
import subsonic from '../../api/subsonic'

describe('PlayerBar', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    usePlayerStore.setState({
      currentTrack: {
        id: 's1',
        title: 'Lapis',
        artist: 'The Panturas',
        album: 'Mabuk Laut',
        starred: false,
        bitRate: 320,
      },
      isPlaying: false,
      currentTime: 10,
      duration: 180,
      volume: 0.8,
    })
    subsonic.setCredentials('alice', 'tok', 'salt')
  })

  it('renders playback controls and volume slider', () => {
    render(
      <BrowserRouter>
        <PlayerBar />
      </BrowserRouter>
    )

    expect(screen.getByText('Lapis')).toBeInTheDocument()
    expect(screen.getByText('The Panturas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /shuffle/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^play$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /repeat/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /favorite current track/i })).toBeInTheDocument()
  })

  it('toggles favorite when clicking the favorite button', async () => {
    vi.spyOn(subsonic, 'star').mockResolvedValue(true)

    render(
      <BrowserRouter>
        <PlayerBar />
      </BrowserRouter>
    )

    const favBtn = screen.getByRole('button', { name: /favorite current track/i })
    fireEvent.click(favBtn)

    expect(subsonic.star).toHaveBeenCalledWith('s1')
  })
})
