import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginView from './LoginView'
import { useAuthStore } from '../../store/useAuthStore'

describe('LoginView', () => {
  it('renders login form inputs and submits credentials', async () => {
    const loginMock = vi.fn().mockResolvedValue(true)
    useAuthStore.setState({ login: loginMock, isLoading: false, error: null })

    render(<LoginView />)

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'audiophile' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    expect(loginMock).toHaveBeenCalledWith('audiophile', 'secret')
  })
})
