import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePlaylistStore } from './usePlaylistStore'
import subsonic from '../api/subsonic'

describe('usePlaylistStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    usePlaylistStore.setState({ playlists: [], loading: false })
  })

  it('fetches playlists and updates store', async () => {
    const mockList = [{ id: 'p1', name: 'Chill Beats', songCount: 5 }]
    vi.spyOn(subsonic, 'getPlaylists').mockResolvedValue(mockList)

    const result = await usePlaylistStore.getState().fetchPlaylists()
    expect(result).toEqual(mockList)
    expect(usePlaylistStore.getState().playlists).toEqual(mockList)
  })

  it('creates playlist and triggers re-fetch', async () => {
    vi.spyOn(subsonic, 'createPlaylist').mockResolvedValue({ id: 'p2', name: 'Workout Mix' })
    vi.spyOn(subsonic, 'getPlaylists').mockResolvedValue([{ id: 'p2', name: 'Workout Mix' }])

    await usePlaylistStore.getState().createPlaylist('Workout Mix')
    expect(subsonic.createPlaylist).toHaveBeenCalledWith(null, 'Workout Mix', [])
    expect(usePlaylistStore.getState().playlists.length).toBe(1)
  })

  it('renames playlist and re-fetches', async () => {
    vi.spyOn(subsonic, 'updatePlaylistName').mockResolvedValue(true)
    vi.spyOn(subsonic, 'getPlaylists').mockResolvedValue([{ id: 'p1', name: 'Updated Beats' }])

    const success = await usePlaylistStore.getState().renamePlaylist('p1', 'Updated Beats')
    expect(success).toBe(true)
    expect(subsonic.updatePlaylistName).toHaveBeenCalledWith('p1', 'Updated Beats')
  })

  it('deletes playlist and re-fetches', async () => {
    vi.spyOn(subsonic, 'deletePlaylist').mockResolvedValue(true)
    vi.spyOn(subsonic, 'getPlaylists').mockResolvedValue([])

    const success = await usePlaylistStore.getState().deletePlaylist('p1', 'Updated Beats')
    expect(success).toBe(true)
    expect(subsonic.deletePlaylist).toHaveBeenCalledWith('p1')
    expect(usePlaylistStore.getState().playlists.length).toBe(0)
  })
})
