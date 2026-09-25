import { useState, useEffect } from 'react'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useUIStore } from '../../store/useUIStore'
import { showToast } from '../../store/useToastStore'
import Artwork from '../common/Artwork'
import Scrubber from '../common/Scrubber'
import LyricsView from '../player/LyricsView'
import AudioVisualizer from '../player/AudioVisualizer'
import subsonic from '../../api/subsonic'

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function RightPanel() {
  const {
    currentTrack,
    currentTime,
    duration,
    volume,
    isPlaying,
    seek,
    setVolume,
    togglePlay,
    playNext,
    playPrev,
    isShuffle,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    queue,
    playTrack,
    removeFromQueue,
    clearQueue,
    reorderQueue,
  } = usePlayerStore()
  const { isRightPanelOpen, openRightPanel, activePanelTab, setActivePanelTab, closeRightPanel } = useUIStore()
  const [lrc, setLrc] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDrop = (e, targetIndex) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      reorderQueue(draggedIndex, targetIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleToggleStarCurrent = async () => {
    if (!currentTrack?.id) return
    const newStarred = !currentTrack.starred
    try {
      if (newStarred) {
        await subsonic.star(currentTrack.id)
        showToast(`Added "${currentTrack.title}" to Favorites`, 'success', 'favorite')
      } else {
        await subsonic.unstar(currentTrack.id)
        showToast(`Removed "${currentTrack.title}" from Favorites`, 'info', 'favorite_border')
      }
      usePlayerStore.setState((state) => ({
        currentTrack: state.currentTrack ? { ...state.currentTrack, starred: newStarred } : null,
      }))
    } catch (err) {
      console.error('Failed to toggle star:', err)
    }
  }

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

  if (!isRightPanelOpen) {
    return (
      <aside className="hidden md:flex fixed right-0 top-0 bottom-[76px] w-16 bg-surface-container-lowest border-l border-outline-variant flex-col z-30 select-none transition-all duration-300">
        {/* Top Header Block aligned with Top Navbar h-16 */}
        <div className="h-16 px-3 border-b border-outline-variant w-full" />
        {/* Vertically Centered Expand Button */}
        <div className="flex-1 flex items-center justify-center">
          <button
            type="button"
            aria-label="Expand Right Panel"
            title="Expand Now Playing & Queue panel"
            onClick={openRightPanel}
            className="w-10 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant flex items-center justify-center text-primary transition-all cursor-pointer shadow-sm group"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
              chevron_left
            </span>
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="fixed right-0 top-0 bottom-14 md:bottom-[76px] w-full md:w-[320px] bg-surface-container-lowest border-l border-outline-variant flex flex-col z-50 select-none shadow-2xl animate-in slide-in-from-bottom md:animate-none">
      {/* Header Tabs: Now Playing & Queue */}
      <div className="h-14 md:h-16 px-3 flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest/90 backdrop-blur-md">
        <button
          type="button"
          aria-label="Dismiss player"
          onClick={closeRightPanel}
          className="md:hidden w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface leading-none"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">keyboard_arrow_down</span>
        </button>

        <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl">
          <button
            type="button"
            aria-label="Show Now Playing monitor"
            onClick={() => setActivePanelTab('monitor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer leading-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 ${
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
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 leading-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 ${
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

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-primary pr-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Live</span>
          </div>

          <button
            type="button"
            aria-label="Close panel"
            onClick={closeRightPanel}
            className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer leading-none"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">close</span>
          </button>
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
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    onClick={() => playTrack(track, queue)}
                    className={`group flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                      draggedIndex === idx
                        ? 'opacity-40 border border-dashed border-primary bg-primary/5'
                        : dragOverIndex === idx && draggedIndex !== idx
                        ? 'border-t-2 border-primary bg-primary/10'
                        : isCurrent
                        ? 'bg-surface-container text-primary font-semibold border border-primary/20'
                        : 'hover:bg-surface-container-high text-on-surface border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span
                        className="material-symbols-outlined text-[15px] text-on-surface-variant/40 group-hover:text-primary cursor-grab active:cursor-grabbing leading-none select-none flex-shrink-0"
                        title="Drag to reorder"
                      >
                        drag_indicator
                      </span>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0 border border-outline-variant/60">
                        <Artwork record={track} size={80} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate leading-snug">
                          {track.title}
                        </p>
                        <p className="text-[11px] text-on-surface-variant truncate">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isCurrent ? (
                        <span className="material-symbols-outlined text-[18px] text-primary animate-pulse leading-none">
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
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-md hover:bg-surface-container text-on-surface-variant hover:text-red-400 flex items-center justify-center transition-all cursor-pointer leading-none"
                        >
                          <span className="material-symbols-outlined text-[16px] leading-none">close</span>
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
        <div className="flex-1 overflow-y-auto p-4 md:p-4 space-y-5">
          {/* Large Hero Artwork */}
          <div className="relative aspect-square w-full max-w-[280px] md:max-w-none mx-auto rounded-2xl bg-surface-container-high overflow-hidden border border-outline-variant shadow-2xl group">
            <Artwork record={currentTrack} size={400} className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant font-mono text-[10px] text-primary font-medium">
              24-bit / 96kHz Lossless
            </div>
          </div>

          {/* Track Title, Artist, and Favorite Heart */}
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <h3 className="font-serif text-lg font-semibold text-on-surface truncate">
                {currentTrack?.title || 'No Track Selected'}
              </h3>
              <p className="text-xs text-on-surface-variant truncate">
                {currentTrack?.artist || 'Select a song to start'}
              </p>
              <p className="font-mono text-[10px] text-on-surface-dim uppercase tracking-wider">
                {currentTrack?.album ? `Album: ${currentTrack.album}` : 'Navidwirome Stream'}
              </p>
            </div>

            {currentTrack && (
              <button
                type="button"
                aria-label="Favorite current track mobile panel"
                onClick={handleToggleStarCurrent}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border border-outline-variant/60 ${
                  currentTrack.starred
                    ? 'text-primary bg-primary/10 border-primary/30'
                    : 'text-on-surface-variant bg-surface-container-low hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {currentTrack.starred ? 'favorite' : 'favorite'}
                </span>
              </button>
            )}
          </div>

          {/* Full Interactive Scrubber & Timers (Visible on Mobile inside full-screen view) */}
          <div className="space-y-1 md:hidden pt-1">
            <Scrubber value={currentTime} max={duration} onChange={seek} className="w-full" />
            <div className="flex items-center justify-between font-mono text-[10px] text-on-surface-dim pt-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Mobile Full Ergonomic Transport Controls (Visible on Mobile inside full-screen view) */}
          <div className="flex md:hidden items-center justify-around py-2 border-y border-outline-variant/60">
            <button
              type="button"
              aria-label="Shuffle"
              onClick={toggleShuffle}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isShuffle ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">shuffle</span>
            </button>

            <button
              type="button"
              aria-label="Previous"
              onClick={playPrev}
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[24px]">skip_previous</span>
            </button>

            <button
              type="button"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all"
            >
              <span className="material-symbols-outlined text-[30px]">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            <button
              type="button"
              aria-label="Next"
              onClick={playNext}
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[24px]">skip_next</span>
            </button>

            <button
              type="button"
              aria-label="Repeat"
              onClick={toggleRepeat}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                repeatMode !== 'off' ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {repeatMode === 'one' ? 'repeat_one' : 'repeat'}
              </span>
            </button>
          </div>

          {/* Mobile Volume Slider */}
          <div className="flex md:hidden items-center gap-3 px-2 py-1">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant leading-none">
              {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
            </span>
            <Scrubber value={volume} max={1} onChange={setVolume} className="flex-1" />
          </div>

          {/* Live Synchronized Lyrics */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant space-y-2">
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
