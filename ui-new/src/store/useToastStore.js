import { create } from 'zustand'

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'info', icon = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9)
    const newToast = { id, message, type, icon }
    set((state) => ({ toasts: [...state.toasts, newToast] }))

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 2800)
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export const showToast = (message, type = 'info', icon = 'info') => {
  useToastStore.getState().addToast(message, type, icon)
}
