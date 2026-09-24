import { useState, useEffect } from 'react'
import subsonic from '../api/subsonic'
import Artwork from '../components/common/Artwork'
import { usePlayerStore } from '../store/usePlayerStore'

function formatDuration(seconds) {
  if (!seconds) return '0 min'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins} min`
}

export default function PlaylistsView() {
  const [playlists, setPlaylists] = useState([])
  const [searchFilter, setSearchFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const { playTrack } = usePlayerStore()

  const loadPlaylists = () => {
    setLoading(true)
    subsonic
      .getPlaylists()
      .then((data) => {
        setPlaylists(data || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load playlists:', err)
        setPlaylists([])
        setLoading(false)
      })
  }

  useEffect(() => {
    loadPlaylists()
  }, [])

  const handleCreatePlaylist = async () => {
    const name = window.prompt('Enter new playlist name:')
    if (name?.trim()) {
      try {
        await subsonic.createPlaylist(null, name.trim())
        loadPlaylists()
      } catch (err) {
        console.error('Failed to create playlist:', err)
      }
    }
  }

  const handlePlayPlaylist = async (pl) => {
    try {
      const data = await subsonic.getPlaylist(pl.id)
      const songs = data?.entry || []
      if (songs.length > 0) {
        playTrack(songs[0], songs)
      }
    } catch (err) {
      console.error('Failed to play playlist:', err)
    }
  }

  const filtered = playlists.filter((pl) => {
    if (!searchFilter.trim()) return true
    return pl.name.toLowerCase().includes(searchFilter.toLowerCase())
  })

  return (
    <div className="space-y-6">
      {/* Header, Search Filter, and Create Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant">
        <div>
          <h1 className="font-headline-lg text-2xl md:text-3xl font-semibold text-on-surface tracking-tight">
            User Playlists
          </h1>
          <p className="font-body-sm text-xs md:text-sm text-on-surface-variant">
            Custom listening queues, mixtape sessions, and catalog collections
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-full md:w-64 relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter playlists..."
              className="w-full h-9 pl-8 pr-3 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="button"
            aria-label="Create Playlist"
            onClick={handleCreatePlaylist}
            className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-bright transition-all shadow-sm flex-shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Create Playlist</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl">queue_music</span>
          </div>
          <div className="space-y-1">
            <h3 className="font-headline-sm text-base font-semibold text-on-surface">
              No playlists found
            </h3>
            <p className="font-body-sm text-xs text-on-surface-variant max-w-sm">
              Create your first mixtape or curated collection to organize your favorite studio tracks.
            </p>
          </div>
          <button
            type="button"
            aria-label="Create Playlist"
            onClick={handleCreatePlaylist}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary-bright transition-all shadow-lg cursor-pointer hover:scale-105"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Create First Playlist</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((pl) => (
            <div
              key={pl.id}
              onClick={() => handlePlayPlaylist(pl)}
              className="group flex flex-col gap-2 p-2 rounded-xl bg-surface-container-low border border-outline-variant hover:bg-surface-container hover:border-primary/30 transition-all cursor-pointer"
            >
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-surface-container-high shadow-md">
                <Artwork
                  record={{ ...pl, sync: true }}
                  size={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  aria-label={`Play ${pl.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlayPlaylist(pl)
                  }}
                  className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-105 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[22px]">play_arrow</span>
                </button>
              </div>

              <div className="space-y-0.5 pt-1">
                <h3 className="font-body-md text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                  {pl.name}
                </h3>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-on-surface-variant/60 pt-0.5">
                  <span>{pl.songCount || 0} tracks</span>
                  <span>•</span>
                  <span>{formatDuration(pl.duration)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
