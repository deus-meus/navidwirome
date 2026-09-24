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

  it('adds track to existing queue with addToQueue', () => {
    const track1 = { id: '1', title: 'Track 1' }
    const track2 = { id: '2', title: 'Track 2' }

    usePlayerStore.setState({ queue: [track1], queueIndex: 0 })
    usePlayerStore.getState().addToQueue(track2)

    expect(usePlayerStore.getState().queue).toHaveLength(2)
    expect(usePlayerStore.getState().queue[1].id).toBe('2')
  })

  it('prevents adding duplicate track to queue', () => {
    const track1 = { id: '1', title: 'Track 1' }
    usePlayerStore.setState({ queue: [track1], queueIndex: 0 })

    const added = usePlayerStore.getState().addToQueue(track1)
    expect(added).toBe(false)
    expect(usePlayerStore.getState().queue).toHaveLength(1)
  })

  it('reorders queue and shifts queueIndex accurately', () => {
    const track1 = { id: '1', title: 'Track 1' }
    const track2 = { id: '2', title: 'Track 2' }
    const track3 = { id: '3', title: 'Track 3' }

    // Initial: [Track 1 (playing, idx=0), Track 2, Track 3]
    usePlayerStore.setState({ queue: [track1, track2, track3], queueIndex: 0 })

    // Move Track 1 to end (index 0 -> index 2)
    usePlayerStore.getState().reorderQueue(0, 2)
    const queue = usePlayerStore.getState().queue
    expect(queue.map((t) => t.id)).toEqual(['2', '3', '1'])
    expect(usePlayerStore.getState().queueIndex).toBe(2)

    // Move Track 3 to beginning (index 1 -> index 0)
    usePlayerStore.getState().reorderQueue(1, 0)
    expect(usePlayerStore.getState().queue.map((t) => t.id)).toEqual(['3', '2', '1'])
    // Current playing is '1' (was index 2, should still be index 2)
    expect(usePlayerStore.getState().queueIndex).toBe(2)
  })
})
