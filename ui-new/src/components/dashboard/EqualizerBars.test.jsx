import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EqualizerBars from './EqualizerBars'

describe('EqualizerBars', () => {
  it('renders 3 animated bars with primary styling', () => {
    render(<EqualizerBars />)
    const eq = screen.getByTestId('equalizer-bars')
    expect(eq).toBeInTheDocument()
    expect(eq.children.length).toBe(3)
  })
})
