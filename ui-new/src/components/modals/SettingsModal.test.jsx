import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SettingsModal from './SettingsModal'
import { useAuthStore } from '../../store/useAuthStore'
import subsonic from '../../api/subsonic'

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({
      user: { username: 'admin' },
      isAuthenticated: true,
    })
    vi.spyOn(subsonic, 'startScan').mockResolvedValue({ scanning: true, count: 50 })
    vi.spyOn(subsonic, 'getScanStatus').mockResolvedValue({ scanning: false, count: 120 })
  })

  it('renders user details, server status, and library scan button', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />)

    expect(screen.getByText('Settings & Profile')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByText(/Rescan Library/i)).toBeInTheDocument()
    expect(screen.getByText(/Keyboard Shortcuts/i)).toBeInTheDocument()
  })

  it('triggers library rescan when clicking Rescan Library button', async () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />)

    const scanBtn = screen.getByRole('button', { name: /rescan library/i })
    fireEvent.click(scanBtn)

    await waitFor(() => {
      expect(subsonic.startScan).toHaveBeenCalled()
    })
  })

  it('calls logout when clicking Log Out button', () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout')
    render(<SettingsModal isOpen={true} onClose={() => {}} />)

    const logoutBtn = screen.getByRole('button', { name: /log out/i })
    fireEvent.click(logoutBtn)

    expect(logoutSpy).toHaveBeenCalled()
  })
})
