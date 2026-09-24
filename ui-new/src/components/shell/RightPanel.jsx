import { useState, useEffect } from 'react'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useUIStore } from '../../store/useUIStore'
import Artwork from '../common/Artwork'
import LyricsView from '../player/LyricsView'
import AudioVisualizer from '../player/AudioVisualizer'
import subsonic from '../../api/subsonic'

export default function RightPanel() {
  const { currentTrack, currentTime, isPlaying, seek } = usePlayerStore()
  const { isRightPanelOpen, toggleRightPanel } = useUIStore()
  const [lrc, setLrc] = useState('')

  useEffect(() => {
    if (!currentTrack?.id) {
      setLrc('')
      return
    }

    subsonic
      .getLyrics(currentTrack.id)
      .then((data) => {
        if (data?.line?.length > 0) {
          // Format structured lyrics into LRC string
          const formatted = data.line
            .map((l) => {
              const start = (l.start || 0) / 1000
              const m = Math.floor(start / 60)
              const s = (start % 60).toFixed(2)
              return `[${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}]${l.value || ''}`
            })
            .join('\n')
          setLrc(formatted)
        } else {
          setLrc('')
        }
      })
      .catch(() => {
        setLrc('')
      })
  }, [currentTrack?.id])

  if (!isRightPanelOpen) return null

  return (
    <aside className="fixed right-0 top-0 bottom-[76px] w-[320px] bg-surface-container-lowest border-l border-outline-variant flex flex-col z-30 select-none">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="font-serif text-sm font-semibold text-on-surface">Now Playing</span>
          <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-mono text-[9px] font-bold uppercase tracking-wider">
            {currentTrack?.suffix ? currentTrack.suffix.toUpperCase() : 'Studio'}
          </span>
        </div>
        <button
          type="button"
          aria-label="Close now playing panel"
          onClick={toggleRightPanel}
          className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Large Artwork */}
        <div className="relative aspect-square w-full rounded-lg bg-surface-container-high overflow-hidden border border-outline-variant shadow-lg group">
          <Artwork record={currentTrack} size={400} className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant font-mono text-[10px] text-primary font-medium">
            24-bit / 96kHz Lossless
          </div>
        </div>

        {/* Track Title & Artist */}
        <div className="space-y-1">
          <h3 className="font-serif text-base font-semibold text-on-surface truncate">
            {currentTrack?.title || 'No Track Selected'}
          </h3>
          <p className="text-xs text-on-surface-variant truncate">
            {currentTrack?.artist || 'Select a song to start'}
          </p>
          <p className="font-mono text-[10px] text-on-surface-dim uppercase tracking-wider">
            {currentTrack?.album ? `Album: ${currentTrack.album}` : 'Navidwirome Stream'}
          </p>
        </div>

        {/* Live Synchronized Lyrics */}
        <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-outline-variant">
            <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">
              Live Synchronized Lyrics
            </span>
            <span className="font-mono text-[10px] text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Sync
            </span>
          </div>
          <LyricsView lrc={lrc} currentTime={currentTime} onSeek={seek} />
        </div>

        {/* Real-time Spectrum Analyzer & Pipeline Telemetry */}
        <AudioVisualizer track={currentTrack} isPlaying={isPlaying} />
      </div>
    </aside>
  )
}
