import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Header from './Header'
import { useUIStore } from '../../store/useUIStore'
import { useAuthStore } from '../../store/useAuthStore'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Header', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useUIStore.setState({ activeTab: 'overview' })
    useAuthStore.setState({ user: null })
  })

  it('renders tabs and upload music button', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    )

    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Up Next')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload music/i })).toBeInTheDocument()
  })

  it('routes to / when clicking any tab (Overview, Up Next, History)', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    )

    const upNextBtn = screen.getByText('Up Next')
    fireEvent.click(upNextBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/')
    expect(useUIStore.getState().activeTab).toBe('queue')
  })

  it('opens upload modal when clicking upload music button', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    )

    const uploadBtn = screen.getByRole('button', { name: /upload music/i })
    fireEvent.click(uploadBtn)

    expect(useUIStore.getState().isUploadOpen).toBe(true)
  })

  it('hides upload music button when user is non-admin and lacks upload permission', () => {
    useAuthStore.setState({
      user: { username: 'dwi', isAdmin: false, canUpload: false },
    })

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    )

    expect(screen.queryByRole('button', { name: /upload music/i })).not.toBeInTheDocument()
  })
})
