import Artwork from '../common/Artwork'
import EqualizerBars from './EqualizerBars'

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export default function TrackTable({
  tracks = [],
  currentTrack = null,
  isPlaying = false,
  onPlayTrack,
  onToggleStar,
  onEditTags,
}) {
  if (!tracks || tracks.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="font-headline-sm text-lg md:text-xl text-on-surface font-semibold tracking-tight">
            Audio Stream Queue &amp; Master Tracks
          </h2>
          <p className="font-body-sm text-xs md:text-sm text-on-surface-variant">
            Direct audio buffer streams: FLAC, ALAC, and MP3
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-surface-container-low border border-outline-variant p-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider h-9 border-b border-outline-variant/60">
              <th className="w-12 text-center">#</th>
              <th>Title</th>
              <th className="hidden sm:table-cell">Album</th>
              <th className="hidden md:table-cell">Bitrate</th>
              <th className="w-20 text-right pr-4">Time</th>
              <th className="w-16 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {tracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id
              const isCurrentPlaying = isCurrent && isPlaying

              let bitrateLabel = 'Lossless'
              if (track.bitRate) {
                bitrateLabel = `${track.bitRate} kbps`
              } else if (track.suffix) {
                bitrateLabel = track.suffix.toUpperCase()
              }

              return (
                <tr
                  key={track.id}
                  onClick={() => onPlayTrack?.(track, tracks)}
                  className={`group h-12 transition-colors cursor-pointer rounded-lg ${
                    isCurrent
                      ? 'bg-surface-container border border-primary/30'
                      : 'hover:bg-surface-container/60'
                  }`}
                >
                  <td className="w-12 text-center rounded-l-lg">
                    {isCurrentPlaying ? (
                      <EqualizerBars className="mx-auto" />
                    ) : (
                      <div className="relative flex items-center justify-center">
                        <span className="font-mono text-xs text-on-surface-variant/70 group-hover:hidden">
                          {idx + 1}
                        </span>
                        <span className="material-symbols-outlined text-[18px] text-primary hidden group-hover:inline-block">
                          play_arrow
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-3 min-w-0 py-1">
                      <div className="w-8 h-8 rounded bg-surface-container-high flex-shrink-0 overflow-hidden border border-outline-variant">
                        <Artwork
                          record={track}
                          size={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="truncate">
                        <span
                          className={`font-body-md text-sm font-medium block truncate ${
                            isCurrent ? 'text-primary font-semibold' : 'text-on-surface'
                          }`}
                        >
                          {track.title}
                        </span>
                        <span className="font-body-sm text-xs text-on-surface-variant block truncate">
                          {track.artist}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className="font-body-md text-xs text-on-surface-variant truncate block max-w-xs">
                      {track.album}
                    </span>
                  </td>
                  <td className="hidden md:table-cell">
                    <span className="font-mono text-xs text-on-surface-variant/70">
                      {bitrateLabel}
                    </span>
                  </td>
                  <td className="w-20 text-right pr-4">
                    <span className="font-mono text-xs text-on-surface-variant/80">
                      {formatDuration(track.duration)}
                    </span>
                  </td>
                  <td className="w-16 text-center rounded-r-lg">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        aria-label="Edit track tags"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditTags?.(track)
                        }}
                        className="text-on-surface-variant hover:text-primary transition-colors inline-flex items-center justify-center p-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          edit_note
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label="Favorite track"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleStar?.(track)
                        }}
                        className="text-on-surface-variant hover:text-primary transition-colors inline-flex items-center justify-center p-1"
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            track.starred ? 'text-primary' : ''
                          }`}
                        >
                          {track.starred ? 'favorite' : 'favorite'}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
