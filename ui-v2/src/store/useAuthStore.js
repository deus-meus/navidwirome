import { create } from 'zustand'
import subsonic from '../api/subsonic'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true, error: null })
    if (!subsonic.hasCredentials()) {
      set({ isAuthenticated: false, user: null, isLoading: false })
      return false
    }
    const isAlive = await subsonic.ping()
    if (isAlive) {
      set({
        isAuthenticated: true,
        user: { username: subsonic.username },
        isLoading: false,
      })
      return true
    } else {
      subsonic.clearCredentials()
      set({ isAuthenticated: false, user: null, isLoading: false })
      return false
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null })
    try {
      await subsonic.login(username, password)
      set({
        isAuthenticated: true,
        user: { username },
        isLoading: false,
        error: null,
      })
      return true
    } catch (err) {
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: err.message || 'Login failed',
      })
      return false
    }
  },

  logout: () => {
    subsonic.clearCredentials()
    set({ isAuthenticated: false, user: null, error: null })
  },
}))
