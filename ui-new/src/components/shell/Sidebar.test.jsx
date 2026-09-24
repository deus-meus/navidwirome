import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuthStore } from '../../store/useAuthStore'
import { usePlaylistStore } from '../../store/usePlaylistStore'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Sidebar', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({
      user: { username: 'kevin_sound', name: 'Kevin', isAdmin: true },
      isAuthenticated: true,
    })
    usePlaylistStore.setState({
      playlists: [],
      fetchPlaylists: vi.fn(),
    })
  })

  it('renders brand and navigation links', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    expect(screen.getByText('Navidwirome')).toBeInTheDocument()
    expect(screen.getByText('Discover')).toBeInTheDocument()
    expect(screen.getByText('Albums')).toBeInTheDocument()
    expect(screen.getByText('kevin_sound')).toBeInTheDocument()
  })

  it('opens profile popover menu when clicking user bar and navigates to /settings', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    const profileTrigger = screen.getByTitle('Open Profile Menu')
    fireEvent.click(profileTrigger)

    // Popover menu should appear
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Log out')).toBeInTheDocument()

    // Clicking Settings triggers navigate('/settings')
    fireEvent.click(screen.getByText('Settings'))
    expect(mockNavigate).toHaveBeenCalledWith('/settings')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
