import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from './useAuthStore'
import subsonic from '../api/subsonic'
import { nativeUserApi } from '../api/nativeUserApi'

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

  it('syncs user permissions from /api/me during checkAuth if token exists', async () => {
    subsonic.setCredentials('bob', 'token123', 'salt456')
    localStorage.setItem('token', 'jwt-test-token')
    vi.spyOn(subsonic, 'ping').mockResolvedValue(true)
    vi.spyOn(nativeUserApi, 'getCurrentUser').mockResolvedValue({
      id: 'u-bob',
      username: 'bob',
      name: 'Bob Marley',
      email: 'bob@example.com',
      isAdmin: false,
      canUpload: true,
      canEditTags: true,
    })

    await useAuthStore.getState().checkAuth()

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user?.canUpload).toBe(true)
    expect(useAuthStore.getState().user?.canEditTags).toBe(true)
    expect(useAuthStore.getState().user?.isAdmin).toBe(false)
    expect(JSON.parse(localStorage.getItem('navidwirome_user')).canUpload).toBe(true)
  })

  it('resets session if token is invalid or expired', async () => {
    subsonic.setCredentials('bob', 'expired', 'salt')
    vi.spyOn(subsonic, 'ping').mockResolvedValue(false)

    await useAuthStore.getState().checkAuth()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBe(null)
  })
})
