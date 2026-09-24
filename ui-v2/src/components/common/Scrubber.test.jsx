import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Scrubber from './Scrubber'

describe('Scrubber', () => {
  it('renders progress bar and fires onChange when interacted', () => {
    const changeMock = vi.fn()
    render(<Scrubber value={30} max={100} onChange={changeMock} />)

    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('aria-valuenow', '30')

    fireEvent.change(slider, { target: { value: '60' } })
    expect(changeMock).toHaveBeenCalledWith(60)
  })
})
