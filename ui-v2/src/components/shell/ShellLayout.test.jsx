import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ShellLayout from './ShellLayout'

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
    expect(screen.getByText(/Ready to stream/i)).toBeInTheDocument()
  })
})
