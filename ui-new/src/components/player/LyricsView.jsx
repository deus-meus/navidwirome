import { useEffect, useRef, useMemo } from 'react'

export function parseLrc(lrcString) {
  if (!lrcString || typeof lrcString !== 'string') return []
  const lines = lrcString.split('\n')
  const result = []

  const timeRegex = /\[(\d{2}):(\d{2}(?:\.\d+)?)\](.*)/

  lines.forEach((line) => {
    const match = line.match(timeRegex)
    if (match) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseFloat(match[2])
      const text = match[3]?.trim() || ''
      if (text) {
        result.push({
          time: minutes * 60 + seconds,
          text,
        })
      }
    }
  })

  return result.sort((a, b) => a.time - b.time)
}

export default function LyricsView({ lrc = '', currentTime = 0, onSeek }) {
  const parsedLines = useMemo(() => parseLrc(lrc), [lrc])
  const activeLineRef = useRef(null)
  const containerRef = useRef(null)

  let activeIndex = -1
  for (let i = 0; i < parsedLines.length; i++) {
    if (currentTime >= parsedLines[i].time) {
      activeIndex = i
    } else {
      break
    }
  }

  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView?.({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [activeIndex])

  if (parsedLines.length === 0) {
    return (
      <div className="py-8 text-center text-on-surface-dim font-mono text-xs">
        No synchronized lyrics available for this track.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="max-h-72 overflow-y-auto space-y-3 py-4 px-1 scroll-smooth"
    >
      {parsedLines.map((line, idx) => {
        const isActive = idx === activeIndex
        return (
          <p
            key={idx}
            ref={isActive ? activeLineRef : null}
            onClick={() => onSeek?.(line.time)}
            className={`cursor-pointer transition-all duration-300 ${
              isActive
                ? 'text-primary font-semibold text-sm scale-100'
                : 'text-on-surface-variant/40 text-xs hover:text-on-surface-variant'
            }`}
          >
            {line.text}
          </p>
        )
      })}
    </div>
  )
}
