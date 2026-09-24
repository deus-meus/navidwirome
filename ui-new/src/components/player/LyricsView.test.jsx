import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LyricsView, { parseLrc } from './LyricsView'

describe('LyricsView', () => {
  const lrcText = `[00:04.50]Signals dissolve across planetary orbits
[00:12.30]We decipher echoes in the electromagnetic static
[00:20.10]Where harmonics fold beyond human perception`

  it('correctly parses LRC timestamps into structured lines', () => {
    const parsed = parseLrc(lrcText)
    expect(parsed).toHaveLength(3)
    expect(parsed[0].time).toBeCloseTo(4.5)
    expect(parsed[0].text).toBe('Signals dissolve across planetary orbits')
    expect(parsed[1].time).toBeCloseTo(12.3)
    expect(parsed[1].text).toBe('We decipher echoes in the electromagnetic static')
  })

  it('renders parsed lyric lines and highlights active line based on currentTime', () => {
    render(<LyricsView lrc={lrcText} currentTime={13.5} />)

    expect(screen.getByText('Signals dissolve across planetary orbits')).toBeInTheDocument()
    const activeLine = screen.getByText('We decipher echoes in the electromagnetic static')
    expect(activeLine).toBeInTheDocument()
    expect(activeLine).toHaveClass('text-primary')
  })

  it('renders graceful empty state when no lyrics are provided', () => {
    render(<LyricsView lrc="" currentTime={0} />)
    expect(screen.getByText(/no synchronized lyrics/i)).toBeInTheDocument()
  })
})
