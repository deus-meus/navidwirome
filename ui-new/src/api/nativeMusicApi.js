import { getAuthHeaders } from './nativeUserApi'

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
}
