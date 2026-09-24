import { describe, it, expect, beforeEach, vi } from 'vitest'
import subsonic from './subsonic'

describe('subsonic API client', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('builds authenticated URL with salt and md5 token', () => {
    subsonic.setCredentials('alice', 'testtoken123', 'randomsalt456')
    const url = subsonic.buildUrl('ping')
    expect(url).toContain('/rest/ping?')
    expect(url).toContain('u=alice')
    expect(url).toContain('t=testtoken123')
    expect(url).toContain('s=randomsalt456')
    expect(url).toContain('v=1.8.0')
    expect(url).toContain('f=json')
  })

  it('generates defensive cover art URLs with proper prefixing', () => {
    subsonic.setCredentials('alice', 'testtoken123', 'randomsalt456')

    // Album record
    const albumUrl = subsonic.getCoverArtUrl({ id: 'alb-1', albumArtist: 'Radiohead' }, 120, true)
    expect(albumUrl).toContain('id=al-alb-1')
    expect(albumUrl).toContain('size=120')

    // MediaFile / Song record
    const songUrl = subsonic.getCoverArtUrl({ id: 'sng-1', album: 'OK Computer' }, 120, true)
    expect(songUrl).toContain('id=mf-sng-1')

    // Playlist record
    const playlistUrl = subsonic.getCoverArtUrl({ id: 'pl-1', sync: true }, 120, true)
    expect(playlistUrl).toContain('id=pl-pl-1')
  })

  it('handles malformed auth on boot by returning false from ping', async () => {
    subsonic.setCredentials('alice', 'invalid-token', 'salt')
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ 'subsonic-response': { status: 'failed', error: { code: 40 } } }),
    })

    const isAlive = await subsonic.ping()
    expect(isAlive).toBe(false)
  })
})
