import md5 from 'blueimp-md5'

class SubsonicClient {
  constructor() {
    this.username = localStorage.getItem('subsonic_username') || ''
    this.token = localStorage.getItem('subsonic_token') || ''
    this.salt = localStorage.getItem('subsonic_salt') || ''
    this.serverUrl = ''
  }

  setCredentials(username, token, salt) {
    this.username = username
    this.token = token
    this.salt = salt
    localStorage.setItem('subsonic_username', username)
    localStorage.setItem('subsonic_token', token)
    localStorage.setItem('subsonic_salt', salt)
  }

  clearCredentials() {
    this.username = ''
    this.token = ''
    this.salt = ''
    localStorage.removeItem('subsonic_username')
    localStorage.removeItem('subsonic_token')
    localStorage.removeItem('subsonic_salt')
  }

  hasCredentials() {
    return Boolean(this.username && this.token && this.salt)
  }

  createToken(password) {
    const salt = Math.random().toString(36).substring(2, 12)
    const token = md5(password + salt)
    return { token, salt }
  }

  buildUrl(endpoint, params = {}) {
    const searchParams = new URLSearchParams()
    searchParams.append('u', this.username)
    searchParams.append('t', this.token)
    searchParams.append('s', this.salt)
    searchParams.append('v', '1.8.0')
    searchParams.append('c', 'NavidwiromeStudio')
    searchParams.append('f', 'json')

    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        searchParams.append(k, String(v))
      }
    })

    return `${this.serverUrl}/rest/${endpoint}?${searchParams.toString()}`
  }

  async request(endpoint, params = {}) {
    const url = this.buildUrl(endpoint, params)
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Subsonic API request failed with status ${res.status}`)
    }
    const data = await res.json()
    const response = data['subsonic-response']
    if (response?.status === 'failed') {
      const err = new Error(response.error?.message || 'Subsonic API error')
      err.code = response.error?.code
      throw err
    }
    return response
  }

  async login(username, password) {
    const { token, salt } = this.createToken(password)
    this.setCredentials(username, token, salt)
    try {
      const ok = await this.ping()
      if (!ok) throw new Error('Invalid credentials')
      return { username, token, salt }
    } catch (err) {
      this.clearCredentials()
      throw err
    }
  }

  async ping() {
    try {
      const res = await this.request('ping')
      return res?.status === 'ok'
    } catch {
      return false
    }
  }

  getStreamUrl(songId, format = 'opus', maxBitRate = 192) {
    const params = { id: songId }
    if (format && format !== 'raw') {
      params.format = format
      if (maxBitRate) params.maxBitRate = maxBitRate
    } else {
      params.format = 'raw'
    }
    return this.buildUrl('stream', params)
  }

  getCoverArtUrl(record, size = 300, square = true) {
    if (!record) return ''
    const extraParams = {}
    if (record._t) {
      extraParams._t = record._t
    }

    let id = ''
    if (typeof record === 'string') {
      id = record.includes('-') ? record : `al-${record}`
    } else if (record.coverArt) {
      id = String(record.coverArt).includes('-') ? String(record.coverArt) : `al-${record.coverArt}`
    } else if (record.id) {
      id = record.id
      if (record.albumId) {
        id = `al-${record.albumId}`
      } else if (record.album && !record.songCount) {
        id = `mf-${record.id}`
      } else if (record.albumArtist || record.songCount !== undefined || (record.name && record.artist && !record.title)) {
        id = `al-${record.id}`
      } else if (record.sync !== undefined) {
        id = `pl-${record.id}`
      } else if (record.title && record.artist) {
        id = `mf-${record.id}`
      } else {
        id = `ar-${record.id}`
      }
    }

    if (!id) return ''

    // Sanitize any accidental query parameters embedded in the id (e.g. "pl-xxx&_t=yyy")
    if (id.includes('&')) {
      const parts = id.split('&')
      id = parts[0]
      parts.slice(1).forEach((param) => {
        const [k, v] = param.split('=')
        if (k && v) extraParams[k] = v
      })
    }

    return this.buildUrl('getCoverArt', { id, size, square, ...extraParams })
  }

  async getPlaylists() {
    const res = await this.request('getPlaylists')
    return res?.playlists?.playlist || []
  }

  async getPlaylist(id) {
    const res = await this.request('getPlaylist', { id })
    return res?.playlist || null
  }

  async createPlaylist(playlistId, name, songIds = []) {
    const params = {}
    if (playlistId) params.playlistId = playlistId
    if (name) params.name = name
    if (songIds.length > 0) params.songId = songIds
    const res = await this.request('createPlaylist', params)
    return res?.playlist || null
  }

  async deletePlaylist(id) {
    const res = await this.request('deletePlaylist', { id })
    return res?.status === 'ok'
  }

  async updatePlaylistName(id, name) {
    const res = await this.request('updatePlaylist', { playlistId: id, name })
    return res?.status === 'ok'
  }

  async updatePlaylistPublic(id, isPublic) {
    const res = await this.request('updatePlaylist', {
      playlistId: id,
      public: Boolean(isPublic),
    })
    return res?.status === 'ok'
  }

  async removeSongFromPlaylist(playlistId, songIndexToRemove) {
    const res = await this.request('updatePlaylist', {
      playlistId,
      songIndexToRemove,
    })
    return res?.status === 'ok'
  }

  async getAlbumList2(type = 'recent', size = 20) {
    const res = await this.request('getAlbumList2', { type, size })
    return res?.albumList2?.album || []
  }

  async getRandomSongs(size = 20) {
    const res = await this.request('getRandomSongs', { size })
    return res?.randomSongs?.song || []
  }

  async getAlbum(id) {
    const res = await this.request('getAlbum', { id })
    return res?.album || null
  }

  async getArtist(id) {
    const res = await this.request('getArtist', { id })
    return res?.artist || null
  }

  async getArtistInfo(id) {
    try {
      const artistId = id?.startsWith('ar-') ? id : `ar-${id}`
      const res = await this.request('getArtistInfo', { id: artistId })
      return res?.artistInfo || null
    } catch {
      return null
    }
  }

  async startScan() {
    const res = await this.request('startScan')
    return res?.scanStatus || { scanning: true }
  }

  async getScanStatus() {
    const res = await this.request('getScanStatus')
    return res?.scanStatus || { scanning: false }
  }

  async addToPlaylist(playlistId, songId) {
    const res = await this.request('updatePlaylist', {
      playlistId,
      songIdToAdd: songId,
    })
    return res?.status === 'ok'
  }

  async getArtists() {
    const res = await this.request('getArtists')
    return res?.artists?.index || []
  }

  async star(id) {
    const res = await this.request('star', { id })
    return res?.status === 'ok'
  }

  async unstar(id) {
    const res = await this.request('unstar', { id })
    return res?.status === 'ok'
  }

  async search3(query, artistCount = 10, albumCount = 10, songCount = 20) {
    if (!query?.trim()) return { artists: [], albums: [], songs: [] }
    const res = await this.request('search3', {
      query,
      artistCount,
      albumCount,
      songCount,
    })
    return {
      artists: res?.searchResult3?.artist || [],
      albums: res?.searchResult3?.album || [],
      songs: res?.searchResult3?.song || [],
    }
  }

  async getLyrics(id) {
    try {
      const res = await this.request('getLyricsBySongId', { id })
      return res?.lyricsList?.structuredLyrics?.[0] || null
    } catch {
      return null
    }
  }
}

const subsonic = new SubsonicClient()
export default subsonic
