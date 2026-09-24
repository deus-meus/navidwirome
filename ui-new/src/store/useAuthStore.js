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
      let savedUser = null
      try {
        const stored = localStorage.getItem('navidwirome_user')
        if (stored) savedUser = JSON.parse(stored)
      } catch {}

      set({
        isAuthenticated: true,
        user: savedUser || { username: subsonic.username, isAdmin: true },
        isLoading: false,
      })
      return true
    } else {
      subsonic.clearCredentials()
      localStorage.removeItem('token')
      localStorage.removeItem('navidwirome_user')
      set({ isAuthenticated: false, user: null, isLoading: false })
      return false
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null })
    try {
      await subsonic.login(username, password)

      let authInfo = { username, isAdmin: true, canUpload: true, canEditTags: true }
      try {
        const res = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.token) {
            localStorage.setItem('token', data.token)
          }
          authInfo = {
            id: data.id,
            username: data.username || username,
            name: data.name,
            isAdmin: Boolean(data.isAdmin),
            canUpload: Boolean(data.canUpload),
            canEditTags: Boolean(data.canEditTags),
          }
          localStorage.setItem('navidwirome_user', JSON.stringify(authInfo))
        }
      } catch (err) {
        console.warn('Native login call non-fatal fallback:', err)
      }

      set({
        isAuthenticated: true,
        user: authInfo,
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
    localStorage.removeItem('token')
    localStorage.removeItem('navidwirome_user')
    set({ isAuthenticated: false, user: null, error: null })
  },
}))
