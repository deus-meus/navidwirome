import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useUIStore } from '../../store/useUIStore'
import { showToast } from '../../store/useToastStore'
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
  const { openRightPanel } = useUIStore()
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

  const handleToggleMute = () => {
    if (volume > 0) {
      setVolume(0)
    } else {
      setVolume(0.8)
    }
  }

  return (
    <footer className="select-none">
      {/* Mobile Mini Player Floating Glass Island */}
      <div className="flex md:hidden fixed bottom-[60px] left-2 right-2 h-14 bg-surface-container-high/95 backdrop-blur-xl border border-outline-variant/80 rounded-2xl shadow-2xl z-30 px-3 items-center justify-between overflow-hidden select-none">
        {/* Top 2.5px Embedded Progress Line */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-outline-variant/30 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* Track Meta & Cover */}
        <div
          onClick={openRightPanel}
          className="flex items-center gap-2.5 min-w-0 flex-1 pr-2 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-surface-container-low overflow-hidden flex-shrink-0 border border-outline-variant/60">
            <Artwork record={currentTrack} size={80} className="w-full h-full object-cover" />
          </div>
          <div className="truncate min-w-0">
            <h4 className="text-xs font-semibold text-on-surface truncate leading-tight">
              {currentTrack?.title || 'No audio selected'}
            </h4>
            <p className="text-[10px] text-on-surface-variant truncate leading-tight mt-0.5">
              {currentTrack?.artist || 'Ready to stream'}
            </p>
          </div>
        </div>

        {/* Mobile Action Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {currentTrack && (
            <button
              type="button"
              aria-label="Favorite current track mobile"
              onClick={handleToggleStarCurrent}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                currentTrack.starred ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">
                {currentTrack.starred ? 'favorite' : 'favorite'}
              </span>
            </button>
          )}

          <button
            type="button"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[21px]">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button
            type="button"
            aria-label="Next"
            onClick={playNext}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">skip_next</span>
          </button>
        </div>
      </div>

      {/* Desktop Player Bar (Visible only on >= md screens) */}
      <div className="hidden md:flex fixed bottom-0 left-0 right-0 h-[76px] bg-surface-container-low border-t border-outline-variant z-50 px-4 items-center justify-between">
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

        {/* Right: Bitrate + Volume + Favorite (Love) at Far Right */}
        <div className="flex items-center justify-end gap-3 w-1/4 min-w-[220px]">
          {/* Bitrate Badge */}
          {currentTrack?.bitRate && (
            <span className="px-2 py-0.5 rounded border border-outline-variant font-mono text-[10px] text-primary flex items-center leading-none h-6">
              {currentTrack.bitRate}k
            </span>
          )}

          {/* Volume Controls */}
          <div className="flex items-center gap-2 w-28">
            <button
              type="button"
              aria-label="Toggle mute"
              onClick={handleToggleMute}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer leading-none"
            >
              <span className="material-symbols-outlined text-[19px] leading-none">
                {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
              </span>
            </button>
            <div className="flex-1 flex items-center">
              <Scrubber value={volume} max={1} onChange={setVolume} className="w-full" />
            </div>
          </div>

          {/* Favorite Love Button - Relocated to Far Right */}
          {currentTrack && (
            <button
              type="button"
              aria-label="Favorite current track"
              title={currentTrack.starred ? 'Favorited' : 'Add to favorites'}
              onClick={handleToggleStarCurrent}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-surface-container leading-none ${
                currentTrack.starred
                  ? 'text-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] leading-none">
                {currentTrack.starred ? 'favorite' : 'favorite'}
              </span>
            </button>
          )}
        </div>
      </div>
    </footer>
  )
}
