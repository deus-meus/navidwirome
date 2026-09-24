import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TrackTable from './TrackTable'

describe('TrackTable', () => {
  const mockTracks = [
    {
      id: 's1',
      title: 'Obscure Gesture',
      artist: 'Burnt Friedman',
      album: 'Secret Rhythms',
      duration: 274, // 4:34
      bitRate: 920,
      suffix: 'flac',
      starred: false,
    },
    {
      id: 's2',
      title: 'Solar Drift',
      artist: 'Solar Echoes',
      album: 'Drift EP',
      duration: 185, // 3:05
      bitRate: 320,
      suffix: 'mp3',
      starred: true,
    },
  ]

  it('renders track headers and all track rows', () => {
    render(<TrackTable tracks={mockTracks} />)

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Album')).toBeInTheDocument()
    expect(screen.getByText('Obscure Gesture')).toBeInTheDocument()
    expect(screen.getByText('Burnt Friedman')).toBeInTheDocument()
    expect(screen.getByText('Secret Rhythms')).toBeInTheDocument()
    expect(screen.getByText('4:34')).toBeInTheDocument()

    expect(screen.getByText('Solar Drift')).toBeInTheDocument()
    expect(screen.getByText('3:05')).toBeInTheDocument()
  })

  it('renders active EqualizerBars when a track is currently playing', () => {
    render(
      <TrackTable
        tracks={mockTracks}
        currentTrack={mockTracks[0]}
        isPlaying={true}
      />
    )

    expect(screen.getByTestId('equalizer-bars')).toBeInTheDocument()
  })

  it('calls onPlayTrack with selected track and queue when clicked', () => {
    const handlePlay = vi.fn()
    render(<TrackTable tracks={mockTracks} onPlayTrack={handlePlay} />)

    const row = screen.getByText('Obscure Gesture')
    fireEvent.click(row)
    expect(handlePlay).toHaveBeenCalledWith(mockTracks[0], mockTracks)
  })

  it('triggers onToggleStar when clicking the favorite heart button', () => {
    const handleStar = vi.fn()
    render(<TrackTable tracks={mockTracks} onToggleStar={handleStar} />)

    const starBtns = screen.getAllByRole('button', { name: /favorite/i })
    fireEvent.click(starBtns[0])
    expect(handleStar).toHaveBeenCalledWith(mockTracks[0])
  })

  it('triggers onEditTags when clicking the edit track tags button', () => {
    const handleEdit = vi.fn()
    render(<TrackTable tracks={mockTracks} onEditTags={handleEdit} />)

    const editBtns = screen.getAllByRole('button', { name: /edit track tags/i })
    fireEvent.click(editBtns[0])
    expect(handleEdit).toHaveBeenCalledWith(mockTracks[0])
  })

  it('triggers addToQueue when clicking add to queue button', () => {
    const handleQueue = vi.fn()
    render(<TrackTable tracks={mockTracks} onAddToQueue={handleQueue} />)

    const queueBtns = screen.getAllByRole('button', { name: /add to queue/i })
    fireEvent.click(queueBtns[0])
    expect(handleQueue).toHaveBeenCalledWith(mockTracks[0])
  })

  it('renders without orange border class on current track row', () => {
    render(
      <TrackTable
        tracks={mockTracks}
        currentTrack={mockTracks[0]}
        isPlaying={true}
      />
    )

    const row = screen.getByText('Obscure Gesture').closest('tr')
    expect(row.className).not.toContain('border-primary')
  })
})
