import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SettingsView from './SettingsView'
import { useAuthStore } from '../store/useAuthStore'
import { nativeUserApi } from '../api/nativeUserApi'

describe('SettingsView', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({
      user: {
        id: 'u1',
        username: 'audiophile_admin',
        name: 'Chief Sound Engineer',
        isAdmin: true,
        canUpload: true,
        canEditTags: true,
      },
      isAuthenticated: true,
    })
    vi.spyOn(nativeUserApi, 'getUsers').mockResolvedValue([
      { id: 'u1', userName: 'audiophile_admin', name: 'Chief Sound Engineer', isAdmin: true },
      { id: 'u2', userName: 'guest_listener', name: 'Guest', isAdmin: false },
    ])
  })

  it('renders page header, profile information, and settings tabs', () => {
    render(
      <MemoryRouter>
        <SettingsView />
      </MemoryRouter>
    )

    expect(screen.getByText(/Settings & System/i)).toBeInTheDocument()
    expect(screen.getByText(/audiophile_admin/i)).toBeInTheDocument()
    expect(screen.getByText('Profile & Library')).toBeInTheDocument()
    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('Audio Engine')).toBeInTheDocument()
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
  })

  it('switches to user management tab and renders users table', async () => {
    render(
      <MemoryRouter>
        <SettingsView />
      </MemoryRouter>
    )

    const userTab = screen.getByRole('button', { name: /user management/i })
    fireEvent.click(userTab)

    await waitFor(() => {
      expect(screen.getByText(/guest_listener/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /\+ add user/i })).toBeInTheDocument()
    })
  })
})
