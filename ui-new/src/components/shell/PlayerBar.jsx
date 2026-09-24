import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useUIStore } from '../../store/useUIStore'
import Artwork from '../common/Artwork'
import Scrubber from '../common/Scrubber'
import subsonic from '../../api/subsonic'

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function PlayerBar() {
  const navigate = useNavigate()
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

  const handleToggleStarCurrent = async () => {
    if (!currentTrack?.id) return
    const newStarred = !currentTrack.starred
    try {
      if (newStarred) {
        await subsonic.star(currentTrack.id)
      } else {
        await subsonic.unstar(currentTrack.id)
      }
      usePlayerStore.setState((state) => ({
        currentTrack: state.currentTrack ? { ...state.currentTrack, starred: newStarred } : null,
      }))
    } catch (err) {
      console.error('Failed to toggle star:', err)
    }
  }

  const handleToggleMute = () => {
    if (volume > 0) {
      setVolume(0)
    } else {
      setVolume(0.8)
    }
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-[76px] bg-surface-container-low border-t border-outline-variant z-50 px-4 flex items-center justify-between select-none">
      {/* Left: Track Meta (Clean: Art + Title + Artist) */}
      <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
        <div
          onClick={() => currentTrack?.albumId && navigate(`/albums/${currentTrack.albumId}`)}
          className={`w-12 h-12 rounded bg-surface-container-high overflow-hidden flex-shrink-0 border border-outline-variant ${
            currentTrack?.albumId ? 'cursor-pointer hover:border-primary/40' : ''
          }`}
        >
          <Artwork record={currentTrack} size={100} className="w-full h-full object-cover" />
        </div>
        <div className="truncate pr-2">
          <h4
            onClick={() => currentTrack?.albumId && navigate(`/albums/${currentTrack.albumId}`)}
            className={`text-xs font-semibold text-on-surface truncate ${
              currentTrack?.albumId ? 'cursor-pointer hover:text-primary' : ''
            }`}
          >
            {currentTrack?.title || 'No audio selected'}
          </h4>
          <p className="text-[11px] text-on-surface-variant truncate">
            {currentTrack?.artist || 'Ready to stream'}
          </p>
        </div>
      </div>

      {/* Center: Controls & Scrubber - Pixel-Perfect Symmetry */}
      <div className="flex flex-col items-center justify-center gap-1.5 w-2/4 max-w-xl">
        <div className="flex items-center justify-center gap-3">
          {/* Shuffle Button */}
          <button
            type="button"
            aria-label="Shuffle"
            onClick={toggleShuffle}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-surface-container ${
              isShuffle ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[19px]">shuffle</span>
          </button>

          {/* Previous Button */}
          <button
            type="button"
            aria-label="Previous"
            onClick={playPrev}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">skip_previous</span>
          </button>

          {/* Play / Pause Primary Button */}
          <button
            type="button"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-bright transition-all shadow-md cursor-pointer hover:scale-105"
          >
            <span className="material-symbols-outlined text-[22px]">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {/* Next Button */}
          <button
            type="button"
            aria-label="Next"
            onClick={playNext}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">skip_next</span>
          </button>

          {/* Repeat Button */}
          <button
            type="button"
            aria-label="Repeat"
            onClick={toggleRepeat}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-surface-container ${
              repeatMode !== 'off' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[19px]">
              {repeatMode === 'one' ? 'repeat_one' : 'repeat'}
            </span>
          </button>
        </div>

        {/* Progress Scrubber */}
        <div className="flex items-center gap-3 w-full">
          <span className="font-mono text-[10px] text-on-surface-dim w-9 text-right tabular-nums">
            {formatTime(currentTime)}
          </span>
          <Scrubber value={currentTime} max={duration} onChange={seek} className="flex-1" />
          <span className="font-mono text-[10px] text-on-surface-dim w-9 text-left tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Favorite (Love) + Bitrate + Volume + Studio Monitor Drawer */}
      <div className="flex items-center justify-end gap-2.5 w-1/4 min-w-[220px]">
        {/* Favorite Love Button relocated to right */}
        {currentTrack && (
          <button
            type="button"
            aria-label="Favorite current track"
            title={currentTrack.starred ? 'Favorited' : 'Add to favorites'}
            onClick={handleToggleStarCurrent}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-surface-container ${
              currentTrack.starred
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[19px]">
              {currentTrack.starred ? 'favorite' : 'favorite'}
            </span>
          </button>
        )}

        {/* Bitrate Badge */}
        {currentTrack?.bitRate && (
          <span className="px-1.5 py-0.5 rounded border border-outline-variant font-mono text-[9px] text-primary flex items-center">
            {currentTrack.bitRate}k
          </span>
        )}

        {/* Volume Controls */}
        <div className="flex items-center gap-1.5 w-28">
          <button
            type="button"
            aria-label="Toggle mute"
            onClick={handleToggleMute}
            className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
            </span>
          </button>
          <div className="flex-1 flex items-center">
            <Scrubber value={volume} max={1} onChange={setVolume} className="w-full" />
          </div>
        </div>

        {/* Right Panel Studio Monitor Toggle */}
        <button
          type="button"
          aria-label="Toggle Now Playing panel"
          onClick={toggleRightPanel}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-surface-container ${
            isRightPanelOpen ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
          title="Toggle Studio Monitor & Lyrics"
        >
          <span className="material-symbols-outlined text-[20px]">queue_music</span>
        </button>
      </div>
    </footer>
  )
}
