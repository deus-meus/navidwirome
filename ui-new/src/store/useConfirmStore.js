import { create } from 'zustand'

export const useConfirmStore = create((set, get) => ({
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

  setInputValue: (val) => set({ inputValue: val }),

  confirm: ({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = true,
  }) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        danger,
        hasInput: false,
        inputValue: '',
        resolve,
      })
    })
  },

  prompt: ({
    title = 'Input Required',
    message = '',
    placeholder = '',
    defaultValue = '',
    inputType = 'text',
    confirmText = 'Submit',
    cancelText = 'Cancel',
    danger = false,
  }) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        title,
        message,
        inputPlaceholder: placeholder,
        inputValue: defaultValue,
        inputType,
        confirmText,
        cancelText,
        danger,
        hasInput: true,
        resolve,
      })
    })
  },

  handleConfirm: () => {
    const { resolve, hasInput, inputValue } = get()
    if (hasInput) {
      resolve?.(inputValue)
    } else {
      resolve?.(true)
    }
    set({ isOpen: false, resolve: null })
  },

  handleCancel: () => {
    const { resolve, hasInput } = get()
    if (hasInput) {
      resolve?.(null)
    } else {
      resolve?.(false)
    }
    set({ isOpen: false, resolve: null })
  },
}))

export const showConfirm = (options) => useConfirmStore.getState().confirm(options)
export const showPrompt = (options) => useConfirmStore.getState().prompt(options)
