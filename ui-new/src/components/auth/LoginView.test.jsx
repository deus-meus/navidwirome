import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginView from './LoginView'
import { useAuthStore } from '../../store/useAuthStore'

describe('LoginView', () => {
  it('renders login form inputs and submits credentials', async () => {
    const loginMock = vi.fn().mockResolvedValue(true)
    useAuthStore.setState({
      login: loginMock,
      checkInitialSetup: vi.fn(),
      isFirstTime: false,
      isLoading: false,
      error: null,
    })

    render(<LoginView />)

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'audiophile' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { type: 'submit' }))

    expect(loginMock).toHaveBeenCalledWith('audiophile', 'secret')
  })

  it('renders initial admin setup banner and creates admin user', async () => {
    const createAdminMock = vi.fn().mockResolvedValue(true)
    useAuthStore.setState({
      createAdmin: createAdminMock,
      checkInitialSetup: vi.fn(),
      isFirstTime: true,
      isLoading: false,
      error: null,
    })

    render(<LoginView />)

    expect(screen.getByText(/Initial Admin Setup/i)).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'admin123' } })
    fireEvent.click(screen.getByRole('button', { type: 'submit' }))

    expect(createAdminMock).toHaveBeenCalledWith('admin', 'admin123')
  })
})
