import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import subsonic from '../api/subsonic'

export default function ArtistsView() {
  const [indexList, setIndexList] = useState([])
  const [searchFilter, setSearchFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    subsonic
      .getArtists()
      .then((data) => {
        setIndexList(data || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load artists:', err)
        setIndexList([])
        setLoading(false)
      })
  }, [])

  const filteredIndexes = indexList
    .map((group) => {
      const filteredArtists = (group.artist || []).filter((art) => {
        if (!searchFilter.trim()) return true
        return art.name.toLowerCase().includes(searchFilter.toLowerCase())
      })
      return { ...group, artist: filteredArtists }
    })
    .filter((group) => group.artist.length > 0)

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant">
        <div>
          <h1 className="font-headline-lg text-2xl md:text-3xl font-semibold text-on-surface tracking-tight">
            Artists Index
          </h1>
          <p className="font-body-sm text-xs md:text-sm text-on-surface-variant">
            Explore performers, composers, and creator discographies
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
            placeholder="Filter artists..."
            className="w-full h-9 pl-8 pr-3 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
        </div>
      ) : filteredIndexes.length === 0 ? (
        <div className="py-20 text-center text-on-surface-variant text-sm font-mono">
          No artists found.
        </div>
      ) : (
        <div className="space-y-8">
          {filteredIndexes.map((group) => (
            <div key={group.name} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="font-headline-sm text-xl font-bold text-primary font-mono w-8">
                  {group.name}
                </span>
                <div className="h-px flex-1 bg-outline-variant/60" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {group.artist.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => navigate(`/artists/${artist.id}`)}
                    className="p-3 rounded-xl bg-surface-container-low border border-outline-variant hover:bg-surface-container hover:border-primary/40 transition-all cursor-pointer group flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                    <div className="min-w-0 pr-1">
                      <p className="text-xs font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                        {artist.name}
                      </p>
                      <p className="text-[11px] text-on-surface-variant/70 font-mono">
                        {artist.albumCount ? `${artist.albumCount} releases` : 'Artist'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
