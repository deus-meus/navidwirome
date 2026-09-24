import { useEffect, useState } from 'react'
import subsonic from '../api/subsonic'
import { usePlayerStore } from '../store/usePlayerStore'
import Artwork from '../components/common/Artwork'
import HeroMaster from '../components/dashboard/HeroMaster'
import AlbumGrid from '../components/dashboard/AlbumGrid'
import TrackTable from '../components/dashboard/TrackTable'

export default function DiscoverView() {
  const [albums, setAlbums] = useState([])
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)

  const { currentTrack, isPlaying, playTrack } = usePlayerStore()

  useEffect(() => {
    let isMounted = true

    Promise.all([
      subsonic.getAlbumList2('recent', 12).catch(() => []),
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
      } else {
        playTrack({ id: album.id, title: album.name || album.title, artist: album.artist })
      }
    } catch {
      playTrack({ id: album.id, title: album.name || album.title, artist: album.artist })
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

  const heroAlbum = albums.length > 0 ? albums[0] : null
  const quickAccessAlbums = albums.slice(0, 8)
  const recentAcquisitions = albums.length > 1 ? albums.slice(1, 11) : albums

  return (
    <div className="space-y-8">
      {/* Top Filter Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button className="px-4 py-1.5 rounded-full bg-on-surface text-background font-semibold text-xs transition-all">
          All
        </button>
        <button className="px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs transition-all">
          Albums
        </button>
        <button className="px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs transition-all">
          Playlists
        </button>
        <button className="px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs transition-all flex items-center gap-1.5">
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
                onClick={() => playTrack({ id: album.id, title: album.name, artist: album.artist })}
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
                  className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md flex-shrink-0"
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
      />

      {/* Recent Albums & Acquisitions Grid (5 Columns) */}
      <AlbumGrid
        albums={recentAcquisitions}
        title="Recent Albums & Acquisitions"
        subtitle="Hi-Res catalog synchronizations from personal storage"
        onPlayAlbum={handlePlayMaster}
      />

      {/* Audio Stream Queue & Master Tracks Table */}
      <TrackTable
        tracks={tracks}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayTrack={(track, queue) => playTrack(track, queue)}
        onToggleStar={handleToggleStar}
      />
    </div>
  )
}
