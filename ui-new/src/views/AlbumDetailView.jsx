import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import subsonic from '../api/subsonic'
import Artwork from '../components/common/Artwork'
import TrackTable from '../components/dashboard/TrackTable'
import { usePlayerStore } from '../store/usePlayerStore'
import { useAuthStore } from '../store/useAuthStore'
import { showConfirm } from '../store/useConfirmStore'
import { showToast } from '../store/useToastStore'

function formatTotalDuration(seconds) {
  if (!seconds) return '0 min'
  const mins = Math.round(seconds / 60)
  return `${mins} min`
}

export default function AlbumDetailView() {
  const { id } = useParams()
  const [album, setAlbum] = useState(null)
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()
  const { currentTrack, isPlaying, playTrack } = usePlayerStore()
  const { user } = useAuthStore()

  useEffect(() => {
    setLoading(true)
    subsonic
      .getAlbum(id)
      .then((data) => {
        setAlbum(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load album details:', err)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center text-primary">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="py-20 text-center text-on-surface-variant font-mono text-sm">
        Album not found.
      </div>
    )
  }

  const songs = album.song || []

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playTrack(songs[0], songs)
    }
  }

  const handleShuffle = () => {
    if (songs.length > 0) {
      const shuffled = [...songs].sort(() => Math.random() - 0.5)
      playTrack(shuffled[0], shuffled)
    }
  }

  const handleDeleteAlbum = async () => {
    const confirmed = await showConfirm({
      title: 'Delete Album',
      message: `Are you sure you want to permanently delete album "${album.name}" and all its audio files? This cannot be undone.`,
      confirmText: 'Delete Album',
      danger: true,
    })
    if (!confirmed) {
      return
    }
    try {
      const res = await fetch(`/api/music/album/${album.id}`, { method: 'DELETE' })
      if (!res.ok) {
        throw new Error('Failed to delete album')
      }
      showToast('Album deleted successfully', 'success')
      navigate('/albums')
    } catch (err) {
      showToast(`Error deleting album: ${err.message}`, 'error')
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
      setAlbum((prev) => ({
        ...prev,
        song: prev.song.map((s) => (s.id === track.id ? { ...s, starred: newStarred } : s)),
      }))
    } catch (err) {
      console.error('Failed to star track:', err)
    }
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
        <Link to="/albums" className="hover:text-primary transition-colors">
          Albums
        </Link>
        <span>/</span>
        <span className="text-on-surface truncate">{album.name}</span>
      </div>

      {/* Album Header Banner */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 rounded-2xl bg-surface-container-low border border-outline-variant shadow-xl">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-xl overflow-hidden bg-surface-container-high shadow-2xl flex-shrink-0">
          <Artwork record={album} size={400} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-mono font-semibold uppercase">
              Full Release
            </div>
            <h1 className="font-headline-lg text-2xl md:text-4xl font-semibold text-on-surface tracking-tight">
              {album.name}
            </h1>
            <p className="text-base text-on-surface-variant font-medium">
              By{' '}
              {album.artistId ? (
                <Link
                  to={`/artists/${album.artistId}`}
                  className="text-primary hover:underline transition-colors"
                >
                  {album.artist}
                </Link>
              ) : (
                <span className="text-on-surface">{album.artist}</span>
              )}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 font-mono text-xs text-on-surface-variant/80">
              {album.year && <span>{album.year}</span>}
              {album.year && <span>•</span>}
              {album.genre && <span>{album.genre}</span>}
              {album.genre && <span>•</span>}
              <span>{songs.length} tracks</span>
              <span>•</span>
              <span>{formatTotalDuration(album.duration)}</span>
            </div>
          </div>

          {/* Action Transport Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <button
              type="button"
              aria-label="Play All"
              onClick={handlePlayAll}
              className="px-6 py-2 rounded-xl bg-primary text-white font-label-md text-sm font-bold hover:bg-primary-bright transition-all shadow-lg flex items-center gap-2 cursor-pointer leading-none"
            >
              <span className="material-symbols-outlined text-[20px] text-white leading-none">play_arrow</span>
              <span>Play All</span>
            </button>
            <button
              type="button"
              aria-label="Shuffle"
              onClick={handleShuffle}
              className="px-4 py-2 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest font-label-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer leading-none"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">shuffle</span>
              <span>Shuffle</span>
            </button>
            {user?.isAdmin && (
              <button
                type="button"
                aria-label="Delete Album"
                onClick={handleDeleteAlbum}
                className="px-4 py-2 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 font-label-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer leading-none"
              >
                <span className="material-symbols-outlined text-[18px] leading-none">delete</span>
                <span>Delete Album</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Album Tracks Table */}
      <TrackTable
        tracks={songs}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayTrack={(track, queue) => playTrack(track, queue)}
        onToggleStar={handleToggleStar}
      />
    </div>
  )
}
