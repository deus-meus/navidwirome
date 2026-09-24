import { usePlayerStore } from '../../store/usePlayerStore'
import { useUIStore } from '../../store/useUIStore'
import Artwork from '../common/Artwork'

export default function RightPanel() {
  const { currentTrack } = usePlayerStore()
  const { isRightPanelOpen, toggleRightPanel } = useUIStore()

  if (!isRightPanelOpen) return null

  return (
    <aside className="fixed right-0 top-0 bottom-[76px] w-[320px] bg-surface-container-lowest border-l border-outline-variant flex flex-col z-30 select-none">
      <div className="h-16 px-4 flex items-center justify-between border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="font-serif text-sm font-semibold text-on-surface">Now Playing</span>
          <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-mono text-[9px] font-bold uppercase tracking-wider">
            Studio
          </span>
        </div>
        <button
          onClick={toggleRightPanel}
          className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Large Artwork */}
        <div className="relative aspect-square w-full rounded-lg bg-surface-container-high overflow-hidden border border-outline-variant shadow-lg">
          <Artwork record={currentTrack} size={400} className="w-full h-full" />
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant font-mono text-[10px] text-primary font-medium">
            Lossless FLAC
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

        {/* Live Synchronized Lyrics Placeholder */}
        <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-outline-variant">
            <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">
              Live Synchronized Lyrics
            </span>
            <span className="font-mono text-[10px] text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Sync
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            <p className="text-xs text-on-surface-dim">Listening to music stream...</p>
            <p className="text-sm text-primary font-medium">Enjoy the high fidelity audio</p>
            <p className="text-xs text-on-surface-dim">Powered by Navidwirome</p>
          </div>
        </div>

        {/* Audio Pipeline Telemetry */}
        <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-medium pb-1 border-b border-outline-variant">
            Audio Pipeline Telemetry
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-on-surface-dim">Source Bitrate</span>
              <span className="font-mono text-xs text-on-surface font-semibold">
                {currentTrack?.bitRate ? `${currentTrack.bitRate} kbps` : 'Bit-Perfect'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-on-surface-dim">Format</span>
              <span className="font-mono text-xs text-primary font-semibold">
                {currentTrack?.suffix ? currentTrack.suffix.toUpperCase() : 'FLAC'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
