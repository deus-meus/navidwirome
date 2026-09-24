import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from './useAuthStore'
import subsonic from '../api/subsonic'

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true })
    vi.restoreAllMocks()
  })

  it('initializes and checks existing session', async () => {
    subsonic.setCredentials('bob', 'token123', 'salt456')
    vi.spyOn(subsonic, 'ping').mockResolvedValue(true)

    await useAuthStore.getState().checkAuth()

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user?.username).toBe('bob')
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('resets session if token is invalid or expired', async () => {
    subsonic.setCredentials('bob', 'expired', 'salt')
    vi.spyOn(subsonic, 'ping').mockResolvedValue(false)

    await useAuthStore.getState().checkAuth()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBe(null)
  })
})
