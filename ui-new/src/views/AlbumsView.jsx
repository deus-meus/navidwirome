import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import subsonic from '../api/subsonic'
import AlbumGrid from '../components/dashboard/AlbumGrid'
import { usePlayerStore } from '../store/usePlayerStore'

export default function AlbumsView() {
  const [albums, setAlbums] = useState([])
  const [sortType, setSortType] = useState('recent')
  const [searchFilter, setSearchFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()
  const { playTrack } = usePlayerStore()

  useEffect(() => {
    setLoading(true)
    subsonic
      .getAlbumList2(sortType, 50)
      .then((data) => {
        setAlbums(data || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load albums:', err)
        setAlbums([])
        setLoading(false)
      })
  }, [sortType])

  const handlePlayAlbum = async (album) => {
    try {
      const fullAlbum = await subsonic.getAlbum(album.id)
      const songs = fullAlbum?.song || []
      if (songs.length > 0) {
        playTrack(songs[0], songs)
      }
    } catch (err) {
      console.error('Failed to play album:', err)
    }
  }

  const filteredAlbums = albums.filter((a) => {
    if (!searchFilter.trim()) return true
    const q = searchFilter.toLowerCase()
    return (
      (a.name || a.title || '').toLowerCase().includes(q) ||
      (a.artist || '').toLowerCase().includes(q)
    )
  })

  const sortTabs = [
    { id: 'recent', label: 'Recent' },
    { id: 'frequent', label: 'Frequent' },
    { id: 'starred', label: 'Starred' },
    { id: 'alphabeticalByName', label: 'By Title' },
    { id: 'alphabeticalByArtist', label: 'By Artist' },
    { id: 'random', label: 'Random' },
  ]

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant">
        <div>
          <h1 className="font-headline-lg text-2xl md:text-3xl font-semibold text-on-surface tracking-tight">
            Albums Catalog
          </h1>
          <p className="font-body-sm text-xs md:text-sm text-on-surface-variant">
            High-fidelity master releases and collection archives
          </p>
        </div>

        {/* Filter Input */}
        <div className="w-full md:w-64 relative">
          <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter albums..."
            className="w-full h-9 pl-8 pr-3 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Sort Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {sortTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSortType(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              sortType === tab.id
                ? 'bg-primary text-white font-semibold shadow-md'
                : 'bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Albums Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-xl bg-surface-container animate-pulse" />
          ))}
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div className="py-20 text-center text-on-surface-variant text-sm font-mono">
          No albums found matching criteria.
        </div>
      ) : (
        <AlbumGrid
          albums={filteredAlbums}
          title=""
          subtitle=""
          onPlayAlbum={handlePlayAlbum}
          onSelectAlbum={(album) => navigate(`/albums/${album.id}`)}
        />
      )}
    </div>
  )
}
