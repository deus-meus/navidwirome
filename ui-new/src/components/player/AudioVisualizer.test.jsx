import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AudioVisualizer from './AudioVisualizer'

describe('AudioVisualizer', () => {
  const mockTrack = {
    title: 'Chronos Polyphony',
    bitRate: 4608,
    suffix: 'flac',
  }

  it('renders spectrum bars and telemetry data', () => {
    render(<AudioVisualizer track={mockTrack} isPlaying={true} />)

    expect(screen.getByText('Audio Pipeline Telemetry')).toBeInTheDocument()
    expect(screen.getByText('DAC Engine')).toBeInTheDocument()
    expect(screen.getByText('Bit-Perfect Direct')).toBeInTheDocument()
    expect(screen.getByText('Dynamic Range')).toBeInTheDocument()
    expect(screen.getByText(/DR14/i)).toBeInTheDocument()
    expect(screen.getByText(/4608 kbps/i)).toBeInTheDocument()
  })

  it('renders spectrum analyzer container', () => {
    render(<AudioVisualizer track={mockTrack} isPlaying={true} />)
    const visualizer = screen.getByTestId('spectrum-analyzer')
    expect(visualizer).toBeInTheDocument()
    expect(visualizer.children.length).toBeGreaterThan(5)
  })
})
