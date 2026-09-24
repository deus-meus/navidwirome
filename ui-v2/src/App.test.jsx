import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders initial application title', () => {
    render(<App />)
    expect(screen.getByText(/Navidwirome Studio v2/i)).toBeInTheDocument()
  })
})
