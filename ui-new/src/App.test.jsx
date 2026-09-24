import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { useAuthStore } from './store/useAuthStore'
import { usePlayerStore } from './store/usePlayerStore'

describe('App Root', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders LoginView when not authenticated', () => {
    useAuthStore.setState({ isAuthenticated: false, isLoading: false, checkAuth: vi.fn() })
    render(<App />)
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('renders ShellLayout and DiscoverView when authenticated', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      isLoading: false,
      user: { username: 'dwinarwastu' },
      checkAuth: vi.fn(),
    })
    render(<App />)
    expect(screen.getAllByText(/Navidwirome/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Quick Access/i)).toBeInTheDocument()
  })

  it('triggers togglePlay on spacebar press outside input fields', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      isLoading: false,
      user: { username: 'dwinarwastu' },
      checkAuth: vi.fn(),
    })

    const togglePlaySpy = vi.fn()
    vi.spyOn(usePlayerStore, 'getState').mockReturnValue({
      togglePlay: togglePlaySpy,
      playTrack: vi.fn(),
      volume: 0.8,
      isPlaying: false,
    })

    render(<App />)

    const event = new KeyboardEvent('keydown', { code: 'Space', bubbles: true })
    window.dispatchEvent(event)

    expect(togglePlaySpy).toHaveBeenCalled()
  })
})
