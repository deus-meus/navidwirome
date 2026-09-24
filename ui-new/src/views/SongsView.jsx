import { useState, useEffect } from 'react'
import subsonic from '../api/subsonic'
import TrackTable from '../components/dashboard/TrackTable'
import { usePlayerStore } from '../store/usePlayerStore'

export default function SongsView() {
  const [tracks, setTracks] = useState([])
  const [searchFilter, setSearchFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const { currentTrack, isPlaying, playTrack } = usePlayerStore()

  useEffect(() => {
    setLoading(true)
    subsonic
      .getRandomSongs(50)
      .then((data) => {
        setTracks(data || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load songs:', err)
        setTracks([])
        setLoading(false)
      })
  }, [])

  const filteredTracks = tracks.filter((t) => {
    if (!searchFilter.trim()) return true
    const q = searchFilter.toLowerCase()
    return (
      (t.title || '').toLowerCase().includes(q) ||
      (t.artist || '').toLowerCase().includes(q) ||
      (t.album || '').toLowerCase().includes(q)
    )
  })

  const handleToggleStar = async (track) => {
    if (!track?.id) return
    const newStarred = !track.starred
    try {
      if (newStarred) {
        await subsonic.star(track.id)
      } else {
        await subsonic.unstar(track.id)
      }
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, starred: newStarred } : t))
      )
    } catch (err) {
      console.error('Failed to star track:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant">
        <div>
          <h1 className="font-headline-lg text-2xl md:text-3xl font-semibold text-on-surface tracking-tight">
            Songs Library
          </h1>
          <p className="font-body-sm text-xs md:text-sm text-on-surface-variant">
            Direct access to all lossless tracks and audio streams
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
            placeholder="Filter songs..."
            className="w-full h-9 pl-8 pr-3 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="py-20 text-center text-on-surface-variant text-sm font-mono">
          No songs found.
        </div>
      ) : (
        <TrackTable
          tracks={filteredTracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayTrack={(track, queue) => playTrack(track, queue)}
          onToggleStar={handleToggleStar}
        />
      )}
    </div>
  )
}
