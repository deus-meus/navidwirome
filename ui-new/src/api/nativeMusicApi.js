import { getAuthHeaders } from './nativeUserApi'

function getAuthOnlyHeaders() {
  const token = localStorage.getItem('token')
  const headers = {}
  if (token) {
    headers['x-nd-authorization'] = `Bearer ${token}`
  }
  return headers
}

export const nativeMusicApi = {
  async updateTrackTags(trackId, tags) {
    const res = await fetch(`/api/music/track/${trackId}/tags`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(tags),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Failed to update track tags: HTTP ${res.status}`)
    }
    return res.json()
  },

  async uploadPlaylistImage(playlistId, file) {
    const formData = new FormData()
    formData.append('image', file)
    const res = await fetch(`/api/playlist/${playlistId}/image`, {
      method: 'POST',
      headers: getAuthOnlyHeaders(),
      body: formData,
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Failed to upload playlist image: HTTP ${res.status}`)
    }
    return true
  },

  async deletePlaylistImage(playlistId) {
    const res = await fetch(`/api/playlist/${playlistId}/image`, {
      method: 'DELETE',
      headers: getAuthOnlyHeaders(),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Failed to delete playlist image: HTTP ${res.status}`)
    }
    return true
  },

  async uploadMusicFile(file) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/music/upload', {
      method: 'POST',
      headers: getAuthOnlyHeaders(),
      body: formData,
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Failed to upload music: HTTP ${res.status}`)
    }
    return res.json()
  },
}
