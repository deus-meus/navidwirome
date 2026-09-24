import { useState, useEffect, useRef } from 'react'
import subsonic from '../../api/subsonic'
import Artwork from '../common/Artwork'

export default function SearchModal({
  isOpen,
  onClose,
  onSelectTrack,
  onSelectAlbum,
  onSelectArtist,
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ artists: [], albums: [], songs: [] })
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults({ artists: [], albums: [], songs: [] })
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!query.trim()) {
      setResults({ artists: [], albums: [], songs: [] })
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await subsonic.search3(query.trim(), 5, 8, 10)
        setResults(res)
      } catch (err) {
        console.error('Search error:', err)
        setResults({ artists: [], albums: [], songs: [] })
      } finally {
        setLoading(false)
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [query])

  if (!isOpen) return null

  const hasResults =
    results.artists.length > 0 || results.albums.length > 0 || results.songs.length > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-background/80 backdrop-blur-md transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant bg-surface-container">
          <span className="material-symbols-outlined text-[22px] text-on-surface-variant">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search catalog (tracks, albums, artists)..."
            className="flex-1 bg-transparent border-none text-on-surface placeholder:text-on-surface-variant/60 text-sm focus:outline-none font-sans"
          />
          {loading && (
            <span className="material-symbols-outlined text-[18px] text-primary animate-spin">
              progress_activity
            </span>
          )}
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-on-surface"
          >
            Esc
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {!query && (
            <div className="py-12 text-center text-on-surface-variant/60 text-xs font-mono">
              Type to search master tracks, albums, or artists...
            </div>
          )}

          {query && !loading && !hasResults && (
            <div className="py-12 text-center text-on-surface-variant text-sm">
              No matching records found for "{query}"
            </div>
          )}

          {/* Songs Results */}
          {results.songs.length > 0 && (
            <div className="space-y-2">
              <span className="font-mono text-[11px] text-primary uppercase tracking-wider font-semibold">
                Songs
              </span>
              <div className="space-y-1">
                {results.songs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      onSelectTrack?.(song, results.songs)
                      onClose()
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded overflow-hidden bg-surface-container-low flex-shrink-0">
                        <Artwork record={song} size={90} className="w-full h-full object-cover" />
                      </div>
                      <div className="truncate">
                        <span className="font-medium text-xs text-on-surface block truncate group-hover:text-primary transition-colors">
                          {song.title}
                        </span>
                        <span className="text-[11px] text-on-surface-variant block truncate">
                          {song.artist}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      play_circle
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Albums Results */}
          {results.albums.length > 0 && (
            <div className="space-y-2">
              <span className="font-mono text-[11px] text-primary uppercase tracking-wider font-semibold">
                Albums
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {results.albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => {
                      onSelectAlbum?.(album)
                      onClose()
                    }}
                    className="p-2 rounded-lg hover:bg-surface-container cursor-pointer group transition-colors flex flex-col gap-1.5"
                  >
                    <div className="aspect-square w-full rounded overflow-hidden bg-surface-container-low">
                      <Artwork record={album} size={150} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-medium text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                      {album.name || album.title}
                    </span>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      {album.artist}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Artists Results */}
          {results.artists.length > 0 && (
            <div className="space-y-2">
              <span className="font-mono text-[11px] text-primary uppercase tracking-wider font-semibold">
                Artists
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {results.artists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => {
                      onSelectArtist?.(artist)
                      onClose()
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-container cursor-pointer group transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-[18px]">person</span>
                    </div>
                    <span className="text-xs font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                      {artist.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
