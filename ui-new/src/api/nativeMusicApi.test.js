import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nativeMusicApi } from './nativeMusicApi'

describe('nativeMusicApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('updateTrackTags sends PUT request with auth headers and updates payload', async () => {
    localStorage.setItem('token', 'mock-jwt-token')
    const mockResponse = { success: true, track: { id: 'track-1', title: 'New Title' } }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    })

    const payload = {
      title: 'New Title',
      artist: 'New Artist',
      album: 'New Album',
      year: '2026',
      genre: 'Audiophile',
      trackNumber: '1',
    }

    const result = await nativeMusicApi.updateTrackTags('track-1', payload)

    expect(global.fetch).toHaveBeenCalledWith('/api/music/track/track-1/tags', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-nd-authorization': 'Bearer mock-jwt-token',
      },
      body: JSON.stringify(payload),
    })
    expect(result).toEqual(mockResponse)
  })

  it('throws an error when updateTrackTags fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue('Forbidden: you do not have permission to edit tags'),
    })

    await expect(
      nativeMusicApi.updateTrackTags('track-1', { title: 'Failed Title' })
    ).rejects.toThrow('Forbidden: you do not have permission to edit tags')
  })
})
