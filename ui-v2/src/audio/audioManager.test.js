import { describe, it, expect, beforeEach, vi } from 'vitest'
import { audioManager } from './audioManager'

describe('audioManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    audioManager.init()
  })

  it('initializes and manages volume within [0, 1] range', () => {
    audioManager.setVolume(0.5)
    expect(audioManager.getVolume()).toBe(0.5)

    // Clamping checks
    audioManager.setVolume(-0.2)
    expect(audioManager.getVolume()).toBe(0)

    audioManager.setVolume(1.5)
    expect(audioManager.getVolume()).toBe(1)
  })

  it('safely handles play and pause calls without throwing', async () => {
    const playSpy = vi.spyOn(audioManager.audio, 'play').mockResolvedValue(undefined)
    const pauseSpy = vi.spyOn(audioManager.audio, 'pause').mockImplementation(() => {})

    await audioManager.play('http://localhost:3000/stream?id=123')
    expect(playSpy).toHaveBeenCalled()

    audioManager.pause()
    expect(pauseSpy).toHaveBeenCalled()
  })
})
