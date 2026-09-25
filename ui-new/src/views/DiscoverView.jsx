import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import subsonic from '../api/subsonic'
import { usePlayerStore } from '../store/usePlayerStore'
import { useUIStore } from '../store/useUIStore'
import Artwork from '../components/common/Artwork'
import HeroMaster from '../components/dashboard/HeroMaster'
import AlbumGrid from '../components/dashboard/AlbumGrid'
import TrackTable from '../components/dashboard/TrackTable'

export default function DiscoverView() {
  const [albums, setAlbums] = useState([])
  const [tracks, setTracks] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()
  const { currentTrack, isPlaying, playTrack, queue } = usePlayerStore()
  const { activeTab } = useUIStore()

  useEffect(() => {
    let isMounted = true

    Promise.all([
      subsonic.getAlbumList2('newest', 16).catch(() => []),
      subsonic.getRandomSongs(10).catch(() => []),
    ])
      .then(([albumList, songList]) => {
        if (!isMounted) return
        setAlbums(albumList || [])
        setTracks(songList || [])
        setLoading(false)
      })
      .catch(() => {
        if (!isMounted) return
        setAlbums([])
        setTracks([])
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handlePlayMaster = async (album) => {
    if (!album) return
    try {
      const albumData = await subsonic.getAlbum(album.id)
      const albumSongs = albumData?.song || []
      if (albumSongs.length > 0) {
        playTrack(albumSongs[0], albumSongs)
      }
    } catch (err) {
      console.error('Failed to play album master:', err)
    }
  }

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
      console.error('Failed to toggle star:', err)
    }
  }

  const handleAddToLibrary = async (album) => {
    if (!album?.id) return
    try {
      await subsonic.star(album.id)
    } catch (err) {
      console.error('Failed to star album:', err)
    }
  }

  // If Up Next Queue tab is selected in Header
  if (activeTab === 'queue') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-headline-lg text-2xl md:text-3xl font-semibold text-on-surface tracking-tight">
            Up Next Queue
          </h1>
          <p className="font-body-sm text-xs md:text-sm text-on-surface-variant">
            Tracks scheduled in the active playback stream
          </p>
        </div>
        {queue.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant font-mono text-sm">
            Queue is empty. Select a song or album to begin streaming.
          </div>
        ) : (
          <TrackTable
            tracks={queue}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={(track, q) => playTrack(track, q)}
            onToggleStar={handleToggleStar}
          />
        )}
      </div>
    )
  }

  // If History tab is selected in Header
  if (activeTab === 'history') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-headline-lg text-2xl md:text-3xl font-semibold text-on-surface tracking-tight">
            Playback History
          </h1>
          <p className="font-body-sm text-xs md:text-sm text-on-surface-variant">
            Recently streamed master recordings
          </p>
        </div>
        {tracks.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant font-mono text-sm">
            No playback history recorded yet.
          </div>
        ) : (
          <TrackTable
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={(track, q) => playTrack(track, q)}
            onToggleStar={handleToggleStar}
          />
        )}
      </div>
    )
  }

  const heroAlbum = albums.length > 0 ? albums[0] : null
  const quickAccessAlbums = albums.slice(0, 8)
  const recentAcquisitions =
    activeFilter === 'hires'
      ? albums.filter((a) => (a.suffix || '').toLowerCase() === 'flac')
      : albums.length > 1
        ? albums.slice(1, 11)
        : albums

  return (
    <div className="space-y-8">
      {/* Top Filter Row */}
      <div className="flex items-center gap-2 overflow-x-auto py-1.5 px-0.5 no-scrollbar scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer border whitespace-nowrap flex-shrink-0 focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 ${
            activeFilter === 'all'
              ? 'bg-on-surface text-background border-on-surface'
              : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:text-on-surface'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => navigate('/albums')}
          className="px-3.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs transition-all cursor-pointer whitespace-nowrap flex-shrink-0 focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
        >
          Albums
        </button>
        <button
          type="button"
          onClick={() => navigate('/playlists')}
          className="px-3.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs transition-all cursor-pointer whitespace-nowrap flex-shrink-0 focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
        >
          Playlists
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'hires' ? 'all' : 'hires')}
          className={`px-3.5 py-1.5 rounded-lg border text-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap flex-shrink-0 focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 ${
            activeFilter === 'hires'
              ? 'bg-primary text-white border-primary font-semibold'
              : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Hi-Res Masters
        </button>
      </div>

      {/* Quick Access Grid: 2x4 */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <h2 className="font-serif text-lg text-on-surface font-semibold tracking-tight">Quick Access</h2>
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Fast Recall</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-surface-container animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickAccessAlbums.map((album) => (
              <div
                key={album.id}
                onClick={() => navigate(`/albums/${album.id}`)}
                className="group relative flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-outline-variant hover:bg-surface-container hover:border-primary/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-surface-container-high flex-shrink-0">
                    <Artwork record={album} size={100} className="w-full h-full" />
                  </div>
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                      {album.name}
                    </p>
                    <p className="text-[11px] text-on-surface-variant truncate">{album.artist}</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Play ${album.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlayMaster(album)
                  }}
                  className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md flex-shrink-0 hover:bg-primary-bright cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Master Spotlight Hero */}
      <HeroMaster
        album={heroAlbum}
        onPlayMaster={handlePlayMaster}
        onAddToLibrary={handleAddToLibrary}
      />

      {/* Recent Albums & Acquisitions Grid (5 Columns) */}
      <AlbumGrid
        albums={recentAcquisitions}
        title="Recent Albums & Acquisitions"
        subtitle="Hi-Res catalog synchronizations from personal storage"
        onPlayAlbum={handlePlayMaster}
        onSelectAlbum={(alb) => navigate(`/albums/${alb.id}`)}
      />

      {/* Audio Stream Queue & Master Tracks Table */}
      <TrackTable
        tracks={tracks}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayTrack={(track, queueTracks) => playTrack(track, queueTracks)}
        onToggleStar={handleToggleStar}
      />
    </div>
  )
}
