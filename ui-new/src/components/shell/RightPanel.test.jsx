import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import RightPanel from './RightPanel'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useUIStore } from '../../store/useUIStore'

describe('RightPanel', () => {
  beforeEach(() => {
    useUIStore.setState({ isRightPanelOpen: true })
    usePlayerStore.setState({
      currentTrack: {
        id: 's1',
        title: 'Chronos Polyphony',
        artist: 'Solar Echoes',
        album: 'Synchronous Drift',
        bitRate: 4608,
        suffix: 'flac',
      },
      currentTime: 10,
      isPlaying: true,
    })
  })

  it('renders now playing artwork, title, and synchronized lyrics container', () => {
    render(<RightPanel />)

    expect(screen.getByText('Now Playing')).toBeInTheDocument()
    expect(screen.getByText('Chronos Polyphony')).toBeInTheDocument()
    expect(screen.getByText('Solar Echoes')).toBeInTheDocument()
    expect(screen.getByText(/Live Synchronized Lyrics/i)).toBeInTheDocument()
    expect(screen.getByText(/Audio Pipeline Telemetry/i)).toBeInTheDocument()
  })
})
