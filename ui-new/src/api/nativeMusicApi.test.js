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

  it('uploadPlaylistImage sends POST request with FormData and auth token', async () => {
    localStorage.setItem('token', 'mock-jwt-token')
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('ok'),
    })

    const mockFile = new File(['image-bytes'], 'cover.png', { type: 'image/png' })
    const result = await nativeMusicApi.uploadPlaylistImage('pl-123', mockFile)

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/playlist/pl-123/image',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'x-nd-authorization': 'Bearer mock-jwt-token',
        },
      })
    )
    expect(result).toBe(true)
  })

  it('deletePlaylistImage sends DELETE request with auth token', async () => {
    localStorage.setItem('token', 'mock-jwt-token')
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('ok'),
    })

    const result = await nativeMusicApi.deletePlaylistImage('pl-123')

    expect(global.fetch).toHaveBeenCalledWith('/api/playlist/pl-123/image', {
      method: 'DELETE',
      headers: {
        'x-nd-authorization': 'Bearer mock-jwt-token',
      },
    })
    expect(result).toBe(true)
  })

  it('uploadMusicFile sends POST request with FormData file and auth token', async () => {
    localStorage.setItem('token', 'mock-jwt-token')
    const mockUploadResponse = { success: true, file: 'track.flac', id: 'trk-1' }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockUploadResponse),
    })

    const mockAudio = new File(['flac-bytes'], 'track.flac', { type: 'audio/flac' })
    const result = await nativeMusicApi.uploadMusicFile(mockAudio)

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/music/upload',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'x-nd-authorization': 'Bearer mock-jwt-token',
        },
      })
    )
    expect(result).toEqual(mockUploadResponse)
  })

  it('throws an error when uploadMusicFile fails', async () => {
    localStorage.setItem('token', 'mock-jwt-token')
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue('Unauthorized'),
    })

    const mockAudio = new File(['flac-bytes'], 'track.flac', { type: 'audio/flac' })
    await expect(nativeMusicApi.uploadMusicFile(mockAudio)).rejects.toThrow('Unauthorized')
  })
})
