import { useState, useEffect } from 'react'
import subsonic from '../api/subsonic'
import Artwork from '../components/common/Artwork'

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

  useEffect(() => {
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
  }, [])

  const filtered = playlists.filter((pl) => {
    if (!searchFilter.trim()) return true
    return pl.name.toLowerCase().includes(searchFilter.toLowerCase())
  })

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant">
        <div>
          <h1 className="font-headline-lg text-2xl md:text-3xl font-semibold text-on-surface tracking-tight">
            User Playlists
          </h1>
          <p className="font-body-sm text-xs md:text-sm text-on-surface-variant">
            Custom listening queues, mixtape sessions, and catalog collections
          </p>
        </div>

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
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-on-surface-variant text-sm font-mono">
          No playlists found.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((pl) => (
            <div
              key={pl.id}
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
                  aria-label="Play playlist"
                  className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-105"
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
