import { create } from 'zustand'
import subsonic from '../api/subsonic'
import { showToast } from './useToastStore'

export const usePlaylistStore = create((set, get) => ({
  playlists: [],
  loading: false,

  fetchPlaylists: async () => {
    set({ loading: true })
    try {
      const list = await subsonic.getPlaylists()
      set({ playlists: list || [], loading: false })
      return list || []
    } catch (err) {
      console.error('Failed to fetch playlists:', err)
      set({ playlists: [], loading: false })
      return []
    }
  },

  createPlaylist: async (name, songIds = []) => {
    if (!name?.trim()) return null
    try {
      const res = await subsonic.createPlaylist(null, name.trim(), songIds)
      await get().fetchPlaylists()
      showToast(`Playlist "${name.trim()}" created`, 'success', 'playlist_add')
      return res
    } catch (err) {
      showToast(`Failed to create playlist: ${err.message}`, 'error', 'error')
      throw err
    }
  },

  renamePlaylist: async (id, name) => {
    if (!name?.trim()) return false
    try {
      await subsonic.updatePlaylistName(id, name.trim())
      await get().fetchPlaylists()
      showToast(`Playlist renamed to "${name.trim()}"`, 'success', 'check_circle')
      return true
    } catch (err) {
      showToast(`Failed to rename playlist: ${err.message}`, 'error', 'error')
      throw err
    }
  },

  deletePlaylist: async (id, name) => {
    try {
      await subsonic.deletePlaylist(id)
      await get().fetchPlaylists()
      showToast(`Playlist ${name ? `"${name}" ` : ''}deleted`, 'success', 'delete')
      return true
    } catch (err) {
      showToast(`Failed to delete playlist: ${err.message}`, 'error', 'error')
      throw err
    }
  },
}))
