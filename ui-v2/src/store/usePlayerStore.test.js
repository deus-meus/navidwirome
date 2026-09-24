import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePlayerStore } from './usePlayerStore'
import { audioManager } from '../audio/audioManager'
import subsonic from '../api/subsonic'

describe('usePlayerStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    usePlayerStore.setState({
      currentTrack: null,
      queue: [],
      queueIndex: -1,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    })
    subsonic.setCredentials('alice', 'tok', 'salt')
  })

  it('sets queue, plays track, and advances to next track', async () => {
    vi.spyOn(audioManager, 'play').mockResolvedValue(undefined)

    const tracks = [
      { id: '1', title: 'Track 1', artist: 'Artist 1', duration: 180 },
      { id: '2', title: 'Track 2', artist: 'Artist 2', duration: 200 },
    ]

    await usePlayerStore.getState().playTrack(tracks[0], tracks)

    expect(usePlayerStore.getState().currentTrack?.id).toBe('1')
    expect(usePlayerStore.getState().queueIndex).toBe(0)
    expect(usePlayerStore.getState().isPlaying).toBe(true)

    // Play next
    await usePlayerStore.getState().playNext()
    expect(usePlayerStore.getState().currentTrack?.id).toBe('2')
    expect(usePlayerStore.getState().queueIndex).toBe(1)
  })
})
