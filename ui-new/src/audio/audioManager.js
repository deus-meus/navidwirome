class AudioManager {
  constructor() {
    this.audio = new Audio()
    this.audio.preload = 'metadata'
    this.listeners = new Map()

    const savedVol = typeof localStorage !== 'undefined' ? localStorage.getItem('navidwirome_volume') : null
    this.audio.volume = savedVol !== null ? Math.min(Math.max(parseFloat(savedVol), 0), 1) : 0.8

    this.attachEvents()
  }

  init() {
    // idempotent initialization
    return this
  }

  attachEvents() {
    this.audio.addEventListener('timeupdate', () => {
      this.emit('timeupdate', this.audio.currentTime)
    })
    this.audio.addEventListener('durationchange', () => {
      this.emit('durationchange', this.audio.duration || 0)
    })
    this.audio.addEventListener('ended', () => {
      this.emit('ended')
    })
    this.audio.addEventListener('play', () => {
      this.emit('playState', true)
    })
    this.audio.addEventListener('pause', () => {
      this.emit('playState', false)
    })
    this.audio.addEventListener('error', (e) => {
      this.emit('error', e)
    })
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
    return () => this.listeners.get(event)?.delete(callback)
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach((cb) => cb(data))
  }

  async play(src) {
    if (src && this.audio.src !== src) {
      this.audio.src = src
      if (typeof this.audio.load === 'function') {
        this.audio.load()
      }
    }
    try {
      await this.audio.play()
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Audio playback failed:', err)
      }
    }
  }

  pause() {
    this.audio.pause()
  }

  seek(seconds) {
    if (Number.isFinite(seconds)) {
      this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration || seconds))
    }
  }

  setVolume(vol) {
    const clamped = Math.max(0, Math.min(vol, 1))
    this.audio.volume = clamped
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('navidwirome_volume', String(clamped))
    }
    this.emit('volumechange', clamped)
  }

  getVolume() {
    return this.audio.volume
  }
}

export const audioManager = new AudioManager()
