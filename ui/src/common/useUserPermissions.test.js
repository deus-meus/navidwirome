import { renderHook } from '@testing-library/react-hooks'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserPermissions } from './useUserPermissions'

const mockPermissions = vi.hoisted(() => ({ value: 'user' }))

vi.mock('react-admin', () => ({
  usePermissions: () => ({ permissions: mockPermissions.value }),
}))

describe('useUserPermissions', () => {
  beforeEach(() => {
    localStorage.clear()
    mockPermissions.value = 'user'
  })

  it('grants all permissions to admin users', () => {
    mockPermissions.value = 'admin'
    const { result } = renderHook(() => useUserPermissions())

    expect(result.current.isAdmin).toBe(true)
    expect(result.current.canUpload).toBe(true)
    expect(result.current.canEditTags).toBe(true)
  })

  it('denies upload and tag editing to regular users without flags', () => {
    mockPermissions.value = 'user'
    const { result } = renderHook(() => useUserPermissions())

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.canUpload).toBe(false)
    expect(result.current.canEditTags).toBe(false)
  })

  it('grants upload to regular users with canUpload flag in localStorage', () => {
    mockPermissions.value = 'user'
    localStorage.setItem('canUpload', 'true')
    const { result } = renderHook(() => useUserPermissions())

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.canUpload).toBe(true)
    expect(result.current.canEditTags).toBe(false)
  })

  it('grants tag editing to regular users with canEditTags flag in localStorage', () => {
    mockPermissions.value = 'user'
    localStorage.setItem('canEditTags', 'true')
    const { result } = renderHook(() => useUserPermissions())

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.canUpload).toBe(false)
    expect(result.current.canEditTags).toBe(true)
  })
})
