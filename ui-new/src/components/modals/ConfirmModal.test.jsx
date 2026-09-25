import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ConfirmModal from './ConfirmModal'
import { useConfirmStore } from '../../store/useConfirmStore'

describe('ConfirmModal', () => {
  beforeEach(() => {
    useConfirmStore.setState({
      isOpen: false,
      title: '',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      danger: true,
      hasInput: false,
      inputValue: '',
      inputPlaceholder: '',
      inputType: 'text',
      resolve: null,
    })
  })

  it('renders nothing when closed', () => {
    const { container } = render(<ConfirmModal />)
    expect(container.firstChild).toBeNull()
  })

  it('renders title, message, and confirmation buttons when open', () => {
    useConfirmStore.setState({
      isOpen: true,
      title: 'Delete Confirmation',
      message: 'Are you sure you want to delete this playlist?',
      confirmText: 'Delete Playlist',
      cancelText: 'Cancel',
      danger: true,
    })

    render(<ConfirmModal />)

    expect(screen.getByRole('heading', { name: /delete confirmation/i })).toBeInTheDocument()
    expect(screen.getByText(/are you sure you want to delete this playlist\?/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete playlist/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('handles confirm button click', () => {
    const handleConfirm = vi.fn()
    useConfirmStore.setState({
      isOpen: true,
      title: 'Confirm Action',
      message: 'Test message',
      handleConfirm,
    })

    render(<ConfirmModal />)

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(handleConfirm).toHaveBeenCalled()
  })

  it('handles cancel button click', () => {
    const handleCancel = vi.fn()
    useConfirmStore.setState({
      isOpen: true,
      title: 'Confirm Action',
      message: 'Test message',
      handleCancel,
    })

    render(<ConfirmModal />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(handleCancel).toHaveBeenCalled()
  })

  it('renders input field in prompt mode and updates value', () => {
    useConfirmStore.setState({
      isOpen: true,
      title: 'Change Password',
      message: 'Enter new password',
      hasInput: true,
      inputValue: 'oldPassword',
      inputPlaceholder: 'New password',
      inputType: 'password',
    })

    render(<ConfirmModal />)

    const input = screen.getByPlaceholderText('New password')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('oldPassword')

    fireEvent.change(input, { target: { value: 'secret999' } })
    expect(useConfirmStore.getState().inputValue).toBe('secret999')
  })
})
