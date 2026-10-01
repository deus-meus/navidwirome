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
    expect(screen.getAllByText(/Sign In/i).length).toBeGreaterThan(0)
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

  it('triggers togglePlay, setVolume, and toggleMute on global hotkeys', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      isLoading: false,
      user: { username: 'dwinarwastu' },
      checkAuth: vi.fn(),
    })

    const togglePlaySpy = vi.fn()
    const setVolumeSpy = vi.fn()
    const toggleMuteSpy = vi.fn()
    vi.spyOn(usePlayerStore, 'getState').mockReturnValue({
      togglePlay: togglePlaySpy,
      setVolume: setVolumeSpy,
      toggleMute: toggleMuteSpy,
      playTrack: vi.fn(),
      volume: 0.8,
      isPlaying: false,
    })

    render(<App />)

    // Spacebar
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
    expect(togglePlaySpy).toHaveBeenCalled()

    // ArrowUp
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp', bubbles: true }))
    expect(setVolumeSpy).toHaveBeenCalledWith(0.85)

    // ArrowDown
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', bubbles: true }))
    expect(setVolumeSpy).toHaveBeenCalledWith(0.75)

    // KeyM
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', bubbles: true }))
    expect(toggleMuteSpy).toHaveBeenCalled()
  })
})
