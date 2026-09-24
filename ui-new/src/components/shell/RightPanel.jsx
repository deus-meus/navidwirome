import { useState, useEffect } from 'react'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useUIStore } from '../../store/useUIStore'
import Artwork from '../common/Artwork'
import LyricsView from '../player/LyricsView'
import AudioVisualizer from '../player/AudioVisualizer'
import subsonic from '../../api/subsonic'

export default function RightPanel() {
  const { currentTrack, currentTime, isPlaying, seek, queue, playTrack, removeFromQueue, clearQueue } =
    usePlayerStore()
  const { isRightPanelOpen } = useUIStore()
  const [activePanelTab, setActivePanelTab] = useState('monitor') // 'monitor' | 'queue'
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
      {/* Header Tabs: Now Playing & Queue */}
      <div className="h-16 px-3 flex items-center justify-between border-b border-outline-variant">
        <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl">
          <button
            type="button"
            aria-label="Show Now Playing monitor"
            onClick={() => setActivePanelTab('monitor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer leading-none ${
              activePanelTab === 'monitor'
                ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Now Playing
          </button>
          <button
            type="button"
            aria-label="Show Playback queue"
            onClick={() => setActivePanelTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 leading-none ${
              activePanelTab === 'queue'
                ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>Queue</span>
            {queue.length > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                {queue.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[10px] text-primary pr-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {activePanelTab === 'queue' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
            <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
              Playback Queue ({queue.length})
            </span>
            {queue.length > 1 && (
              <button
                type="button"
                onClick={clearQueue}
                className="text-[11px] font-mono text-on-surface-variant hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear Queue
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="py-20 text-center text-on-surface-variant font-mono text-xs">
              Queue is empty. Select a song to begin streaming.
            </div>
          ) : (
            <div className="space-y-1">
              {queue.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id
                return (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => playTrack(track, queue)}
                    className={`group flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-surface-container text-primary font-semibold border border-primary/20'
                        : 'hover:bg-surface-container-high text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0 border border-outline-variant/60">
                        <Artwork record={track} size={80} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs truncate leading-snug">
                          {track.title}
                        </p>
                        <p className="text-[10px] text-on-surface-variant truncate">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isCurrent ? (
                        <span className="material-symbols-outlined text-[16px] text-primary animate-pulse leading-none">
                          equalizer
                        </span>
                      ) : (
                        <button
                          type="button"
                          aria-label="Remove from queue"
                          title="Remove from queue"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFromQueue(idx)
                          }}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md hover:bg-surface-container text-on-surface-variant hover:text-red-400 flex items-center justify-center transition-all cursor-pointer leading-none"
                        >
                          <span className="material-symbols-outlined text-[15px] leading-none">close</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
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
      )}
    </aside>
  )
}
