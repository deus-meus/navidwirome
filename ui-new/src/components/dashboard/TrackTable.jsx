import { useState } from 'react'
import Artwork from '../common/Artwork'
import EqualizerBars from './EqualizerBars'
import AddToPlaylistModal from '../modals/AddToPlaylistModal'
import { usePlayerStore } from '../../store/usePlayerStore'
import { showToast } from '../../store/useToastStore'

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
  onAddToQueue,
  onDeleteTrack,
}) {
  const [playlistModalTrack, setPlaylistModalTrack] = useState(null)
  const { addToQueue } = usePlayerStore()

  if (!tracks || tracks.length === 0) {
    return null
  }

  const handleQueueTrack = (track) => {
    if (onAddToQueue) {
      onAddToQueue(track)
    } else {
      addToQueue(track)
      showToast(`Added "${track.title}" to queue`, 'info', 'queue_music')
    }
  }

  const handleDelete = async (track) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete track "${track.title}" from disk? This cannot be undone.`
      )
    ) {
      return
    }
    if (onDeleteTrack) {
      onDeleteTrack(track)
    } else {
      try {
        const res = await fetch(`/api/music/track/${track.id}`, { method: 'DELETE' })
        if (!res.ok) {
          throw new Error('Failed to delete track')
        }
        window.location.reload()
      } catch (err) {
        alert(`Error deleting track: ${err.message}`)
      }
    }
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
              <th className="w-32 text-center">Actions</th>
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
                    isCurrent ? 'bg-surface-container' : 'hover:bg-surface-container/60'
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
                  <td className="w-32 text-center rounded-r-lg">
                    <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {/* Add to Queue */}
                      <button
                        type="button"
                        aria-label="Add to queue"
                        title="Add to queue"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQueueTrack(track)
                        }}
                        className="w-7 h-7 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container flex items-center justify-center transition-colors leading-none"
                      >
                        <span className="material-symbols-outlined text-[17px] leading-none">queue_music</span>
                      </button>

                      {/* Add to Playlist */}
                      <button
                        type="button"
                        aria-label="Add to playlist"
                        title="Add to playlist"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPlaylistModalTrack(track)
                        }}
                        className="w-7 h-7 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container flex items-center justify-center transition-colors leading-none"
                      >
                        <span className="material-symbols-outlined text-[17px] leading-none">playlist_add</span>
                      </button>

                      {/* Edit Tags */}
                      <button
                        type="button"
                        aria-label="Edit track tags"
                        title="Edit metadata"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditTags?.(track)
                        }}
                        className="w-7 h-7 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container flex items-center justify-center transition-colors leading-none"
                      >
                        <span className="material-symbols-outlined text-[17px] leading-none">edit_note</span>
                      </button>

                      {/* Favorite */}
                      <button
                        type="button"
                        aria-label="Favorite track"
                        title="Favorite"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleStar?.(track)
                        }}
                        className="w-7 h-7 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container flex items-center justify-center transition-colors leading-none"
                      >
                        <span
                          className={`material-symbols-outlined text-[17px] leading-none ${
                            track.starred ? 'text-primary' : ''
                          }`}
                        >
                          favorite
                        </span>
                      </button>

                      {/* Delete Track */}
                      <button
                        type="button"
                        aria-label="Delete track"
                        title="Delete song file"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(track)
                        }}
                        className="w-7 h-7 rounded-md text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors leading-none"
                      >
                        <span className="material-symbols-outlined text-[17px] leading-none">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {playlistModalTrack && (
        <AddToPlaylistModal
          isOpen={Boolean(playlistModalTrack)}
          track={playlistModalTrack}
          onClose={() => setPlaylistModalTrack(null)}
        />
      )}
    </div>
  )
}
