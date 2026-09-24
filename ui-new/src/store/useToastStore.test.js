import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useToastStore, showToast } from './useToastStore'

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
    vi.useFakeTimers()
  })

  it('adds and auto-dismisses toast', () => {
    showToast('Track added to queue', 'success', 'queue_music')
    expect(useToastStore.getState().toasts.length).toBe(1)
    expect(useToastStore.getState().toasts[0].message).toBe('Track added to queue')

    vi.advanceTimersByTime(3000)
    expect(useToastStore.getState().toasts.length).toBe(0)
    vi.useRealTimers()
  })
})
