import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuthStore } from '../../store/useAuthStore'
import { usePlaylistStore } from '../../store/usePlaylistStore'
import { useUIStore } from '../../store/useUIStore'

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
    useUIStore.setState({
      isSidebarCollapsed: false,
    })
  })

  it('renders brand and navigation links', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    expect(screen.getAllByText('Navidwirome').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Discover').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Albums').length).toBeGreaterThan(0)
    expect(screen.getAllByText('kevin_sound').length).toBeGreaterThan(0)
  })

  it('opens profile popover menu when clicking user bar and navigates to /settings', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    const profileTrigger = screen.getAllByTitle('Open Profile Menu')[0]
    fireEvent.click(profileTrigger)

    // Popover menu should appear
    expect(screen.getAllByRole('menu').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Log out').length).toBeGreaterThan(0)

    // Clicking Settings triggers navigate('/settings')
    fireEvent.click(screen.getAllByText('Settings')[0])
    expect(mockNavigate).toHaveBeenCalledWith('/settings')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
