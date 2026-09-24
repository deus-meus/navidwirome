import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { useAuthStore } from './store/useAuthStore'

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
})
