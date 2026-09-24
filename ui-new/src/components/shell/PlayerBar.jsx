import { usePlayerStore } from '../../store/usePlayerStore'
import { useUIStore } from '../../store/useUIStore'
import Artwork from '../common/Artwork'
import Scrubber from '../common/Scrubber'

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    seek,
    setVolume,
    playNext,
    playPrev,
    isShuffle,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerStore()

  const { isRightPanelOpen, toggleRightPanel } = useUIStore()

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-[76px] bg-surface-container-low border-t border-outline-variant z-50 px-4 flex items-center justify-between select-none">
      {/* Left: Track Meta */}
      <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
        <div className="w-12 h-12 rounded bg-surface-container-high overflow-hidden flex-shrink-0 border border-outline-variant">
          <Artwork record={currentTrack} size={100} className="w-full h-full" />
        </div>
        <div className="truncate pr-2">
          <h4 className="text-xs font-semibold text-on-surface truncate">
            {currentTrack?.title || 'No audio selected'}
          </h4>
          <p className="text-[11px] text-on-surface-variant truncate">
            {currentTrack?.artist || 'Ready to stream'}
          </p>
        </div>
        {currentTrack && (
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">favorite</span>
          </button>
        )}
      </div>

      {/* Center: Controls & Scrubber */}
      <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={`transition-colors ${isShuffle ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[18px]">shuffle</span>
          </button>
          <button onClick={playPrev} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[20px]">skip_previous</span>
          </button>
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-bright transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[22px]">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button onClick={playNext} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[20px]">skip_next</span>
          </button>
          <button
            onClick={toggleRepeat}
            className={`transition-colors ${repeatMode !== 'off' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {repeatMode === 'one' ? 'repeat_one' : 'repeat'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 w-full">
          <span className="font-mono text-[10px] text-on-surface-dim w-9 text-right">
            {formatTime(currentTime)}
          </span>
          <Scrubber value={currentTime} max={duration} onChange={seek} className="flex-1" />
          <span className="font-mono text-[10px] text-on-surface-dim w-9 text-left">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Volume & Drawer Toggle */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">
        {currentTrack?.bitRate && (
          <span className="px-1.5 py-0.5 rounded border border-outline-variant font-mono text-[9px] text-primary">
            {currentTrack.bitRate}k
          </span>
        )}
        <div className="flex items-center gap-2 w-28">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
          </span>
          <Scrubber value={volume} max={1} onChange={setVolume} className="flex-1" />
        </div>
        <button
          onClick={toggleRightPanel}
          className={`p-1 rounded transition-colors ${
            isRightPanelOpen ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
          title="Toggle Now Playing & Lyrics"
        >
          <span className="material-symbols-outlined text-[20px]">queue_music</span>
        </button>
      </div>
    </footer>
  )
}
