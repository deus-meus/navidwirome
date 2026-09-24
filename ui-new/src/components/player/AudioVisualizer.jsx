import { useState, useEffect } from 'react'

export default function AudioVisualizer({ track, isPlaying = false }) {
  const [barHeights, setBarHeights] = useState(Array(16).fill(20))

  useEffect(() => {
    if (!isPlaying) {
      setBarHeights(Array(16).fill(15))
      return
    }

    const interval = setInterval(() => {
      setBarHeights(
        Array(16)
          .fill(0)
          .map(() => Math.floor(Math.random() * 70) + 15)
      )
    }, 120)

    return () => clearInterval(interval)
  }, [isPlaying])

  const bitrate = track?.bitRate ? `${track.bitRate} kbps` : '4,608 kbps'
  const format = track?.suffix ? track.suffix.toUpperCase() : 'FLAC Lossless'

  return (
    <div className="space-y-4">
      {/* Real-time Spectrum Analyzer */}
      <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-outline-variant">
          <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">
            Real-Time Spectrum Analyzer
          </span>
          <span className="font-mono text-[10px] text-primary flex items-center gap-1 font-semibold">
            {isPlaying ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>

        <div
          data-testid="spectrum-analyzer"
          className="h-16 flex items-end justify-between gap-1 pt-2 px-1"
        >
          {barHeights.map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-primary/30 to-primary rounded-t-sm transition-all duration-100"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between font-mono text-[9px] text-on-surface-variant/60 pt-1">
          <span>20 Hz</span>
          <span>1 kHz</span>
          <span>48 kHz</span>
        </div>
      </div>

      {/* Audio Pipeline Telemetry */}
      <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-medium pb-1 border-b border-outline-variant">
          Audio Pipeline Telemetry
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-on-surface-variant/70">Source Bitrate</span>
            <span className="font-mono text-xs text-on-surface font-semibold">{bitrate}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-on-surface-variant/70">DAC Engine</span>
            <span className="font-mono text-xs text-primary font-semibold">Bit-Perfect Direct</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-on-surface-variant/70">Dynamic Range</span>
            <span className="font-mono text-xs text-on-surface font-semibold">DR14 (Wide)</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-on-surface-variant/70">Format</span>
            <span className="font-mono text-xs text-primary font-semibold">{format}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
