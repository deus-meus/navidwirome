import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SettingsView from './SettingsView'
import { useAuthStore } from '../store/useAuthStore'
import { nativeUserApi } from '../api/nativeUserApi'
import { useConfirmStore } from '../store/useConfirmStore'

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

  it('deletes user after confirming with useConfirmStore', async () => {
    const deleteSpy = vi.spyOn(nativeUserApi, 'deleteUser').mockResolvedValue({ success: true })

    render(
      <MemoryRouter>
        <SettingsView />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /user management/i }))

    await waitFor(() => {
      expect(screen.getByLabelText('Delete user')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Delete user'))

    expect(useConfirmStore.getState().isOpen).toBe(true)
    expect(useConfirmStore.getState().title).toBe('Delete User')

    useConfirmStore.getState().handleConfirm()

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('u2')
    })
  })

  it('updates password using input from showPrompt', async () => {
    const updateSpy = vi.spyOn(nativeUserApi, 'updateUser').mockResolvedValue({ success: true })

    render(
      <MemoryRouter>
        <SettingsView />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /user management/i }))

    await waitFor(() => {
      expect(screen.getAllByLabelText('Change password').length).toBeGreaterThan(0)
    })

    const changePwBtns = screen.getAllByLabelText('Change password')
    fireEvent.click(changePwBtns[1]) // guest_listener

    expect(useConfirmStore.getState().isOpen).toBe(true)
    expect(useConfirmStore.getState().hasInput).toBe(true)
    expect(useConfirmStore.getState().title).toBe('Change Password')

    useConfirmStore.getState().setInputValue('newSecurePassword123')
    useConfirmStore.getState().handleConfirm()

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('u2', { password: 'newSecurePassword123' })
    })
  })

  it('opens edit user drawer and saves updated profile fields', async () => {
    const updateSpy = vi.spyOn(nativeUserApi, 'updateUser').mockResolvedValue({ success: true })

    render(
      <MemoryRouter>
        <SettingsView />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /user management/i }))

    await waitFor(() => {
      expect(screen.getByLabelText('Edit guest_listener')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Edit guest_listener'))

    expect(screen.getByText(/Edit User: @guest_listener/i)).toBeInTheDocument()

    const nameInput = screen.getByDisplayValue('Guest')
    fireEvent.change(nameInput, { target: { value: 'Guest Updated' } })

    const saveBtn = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('u2', expect.objectContaining({
        name: 'Guest Updated',
      }))
    })
  })
})
