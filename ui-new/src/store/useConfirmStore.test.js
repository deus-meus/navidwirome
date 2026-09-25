import { describe, it, expect, beforeEach } from 'vitest'
import { useConfirmStore, showConfirm, showPrompt } from './useConfirmStore'

describe('useConfirmStore', () => {
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

  it('initializes with default closed state', () => {
    const state = useConfirmStore.getState()
    expect(state.isOpen).toBe(false)
    expect(state.hasInput).toBe(false)
  })

  it('showConfirm opens dialog and resolves true on handleConfirm', async () => {
    const confirmPromise = showConfirm({
      title: 'Delete Item',
      message: 'Are you sure?',
      confirmText: 'Delete',
      danger: true,
    })

    const state = useConfirmStore.getState()
    expect(state.isOpen).toBe(true)
    expect(state.title).toBe('Delete Item')
    expect(state.message).toBe('Are you sure?')
    expect(state.confirmText).toBe('Delete')
    expect(state.danger).toBe(true)
    expect(state.hasInput).toBe(false)

    state.handleConfirm()

    const result = await confirmPromise
    expect(result).toBe(true)
    expect(useConfirmStore.getState().isOpen).toBe(false)
  })

  it('showConfirm resolves false on handleCancel', async () => {
    const confirmPromise = showConfirm({
      title: 'Delete Item',
      message: 'Are you sure?',
    })

    useConfirmStore.getState().handleCancel()

    const result = await confirmPromise
    expect(result).toBe(false)
    expect(useConfirmStore.getState().isOpen).toBe(false)
  })

  it('showPrompt opens dialog with input and resolves string value on confirm', async () => {
    const promptPromise = showPrompt({
      title: 'New Password',
      message: 'Enter new password:',
      placeholder: 'Min 6 characters',
      defaultValue: 'secret123',
      inputType: 'password',
    })

    const state = useConfirmStore.getState()
    expect(state.isOpen).toBe(true)
    expect(state.hasInput).toBe(true)
    expect(state.inputValue).toBe('secret123')
    expect(state.inputType).toBe('password')

    useConfirmStore.getState().setInputValue('newPassword456')
    useConfirmStore.getState().handleConfirm()

    const result = await promptPromise
    expect(result).toBe('newPassword456')
  })

  it('showPrompt resolves null on handleCancel', async () => {
    const promptPromise = showPrompt({
      title: 'Prompt',
      message: 'Input something',
    })

    useConfirmStore.getState().handleCancel()

    const result = await promptPromise
    expect(result).toBeNull()
  })
})
