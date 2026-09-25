import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ShellLayout from './ShellLayout'
import { useUIStore } from '../../store/useUIStore'
import { showConfirm } from '../../store/useConfirmStore'

describe('ShellLayout', () => {
  it('renders all 3 zones: Sidebar, Header, PlayerBar, and main child', () => {
    render(
      <BrowserRouter>
        <ShellLayout>
          <div data-testid="test-content">Dashboard Content</div>
        </ShellLayout>
      </BrowserRouter>
    )

    expect(screen.getAllByText(/Navidwirome/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Direct Stream/i)).toBeInTheDocument()
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getAllByText(/Ready to stream/i).length).toBeGreaterThan(0)
  })

  it('opens and closes UploadModal when clicking Upload Music in Sidebar', () => {
    render(
      <BrowserRouter>
        <ShellLayout>
          <div>Main</div>
        </ShellLayout>
      </BrowserRouter>
    )

    const uploadBtn = screen.getByRole('button', { name: /upload music/i })
    fireEvent.click(uploadBtn)

    expect(screen.getByText(/Upload Audio & Batch Tagging/i)).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: /close upload modal/i })
    fireEvent.click(closeBtn)

    expect(useUIStore.getState().isUploadOpen).toBe(false)
  })

  it('renders ConfirmModal when showConfirm is invoked', () => {
    render(
      <BrowserRouter>
        <ShellLayout>
          <div>Main</div>
        </ShellLayout>
      </BrowserRouter>
    )

    act(() => {
      showConfirm({
        title: 'Delete Playlist',
        message: 'Are you sure you want to delete this playlist?',
      })
    })

    expect(screen.getByText('Delete Playlist')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this playlist?')).toBeInTheDocument()
  })
})
