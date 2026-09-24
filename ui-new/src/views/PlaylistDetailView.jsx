import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import subsonic from '../api/subsonic'
import Artwork from '../components/common/Artwork'
import TrackTable from '../components/dashboard/TrackTable'
import RenamePlaylistModal from '../components/modals/RenamePlaylistModal'
import { usePlayerStore } from '../store/usePlayerStore'
import { usePlaylistStore } from '../store/usePlaylistStore'
import { showToast } from '../store/useToastStore'

function formatTotalDuration(seconds) {
  if (!seconds) return '0 min'
  const mins = Math.round(seconds / 60)
  return `${mins} min`
}

export default function PlaylistDetailView() {
  const { id } = useParams()
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRenameOpen, setIsRenameOpen] = useState(false)

  const navigate = useNavigate()
  const { currentTrack, isPlaying, playTrack } = usePlayerStore()
  const { deletePlaylist } = usePlaylistStore()

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true)
      const data = await subsonic.getPlaylist(id)
      setPlaylist(data)
    } catch (err) {
      console.error('Failed to load playlist:', err)
      setPlaylist(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center text-primary">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="py-20 text-center text-on-surface-variant font-mono text-sm space-y-4">
        <p>Playlist not found.</p>
        <Link
          to="/playlists"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-highest transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Playlists</span>
        </Link>
      </div>
    )
  }

  const songs = playlist.entry || []

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

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete playlist "${playlist.name}"? This will not delete the underlying audio files.`
      )
    ) {
      return
    }
    try {
      await deletePlaylist(playlist.id, playlist.name)
      navigate('/playlists')
    } catch (err) {
      console.error('Failed to delete playlist:', err)
    }
  }

  const handleToggleStar = async (track) => {
    if (!track?.id) return
    const newStarred = !track.starred
    try {
      if (newStarred) {
        await subsonic.star(track.id)
        showToast('Added to Favorites', 'success', 'favorite')
      } else {
        await subsonic.unstar(track.id)
        showToast('Removed from Favorites', 'info', 'favorite_border')
      }
      setPlaylist((prev) => ({
        ...prev,
        entry: prev.entry?.map((s) => (s.id === track.id ? { ...s, starred: newStarred } : s)),
      }))
    } catch (err) {
      console.error('Failed to star track:', err)
    }
  }

  return (
    <div className="space-y-8 select-none">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
        <Link to="/playlists" className="hover:text-primary transition-colors">
          Playlists
        </Link>
        <span>/</span>
        <span className="text-on-surface truncate">{playlist.name}</span>
      </div>

      {/* Playlist Header Banner */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 rounded-2xl bg-surface-container-low border border-outline-variant shadow-xl">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-xl overflow-hidden bg-surface-container-high shadow-2xl flex-shrink-0">
          <Artwork record={{ ...playlist, sync: true }} size={400} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-mono font-semibold uppercase">
              Curated Playlist
            </div>
            <h1 className="font-headline-lg text-2xl md:text-4xl font-semibold text-on-surface tracking-tight">
              {playlist.name}
            </h1>
            <p className="text-base text-on-surface-variant font-medium">
              Created by <span className="text-on-surface">{playlist.owner || 'You'}</span>
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 font-mono text-xs text-on-surface-variant/80">
              <span>{songs.length} tracks</span>
              <span>•</span>
              <span>{formatTotalDuration(playlist.duration)}</span>
            </div>
          </div>

          {/* Action Transport Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <button
              type="button"
              aria-label="Play All"
              onClick={handlePlayAll}
              disabled={songs.length === 0}
              className="px-6 py-2.5 rounded-full bg-primary text-white font-label-md text-sm font-bold hover:bg-primary-bright disabled:opacity-50 transition-all shadow-lg flex items-center gap-2 cursor-pointer leading-none"
            >
              <span className="material-symbols-outlined text-[20px] text-white leading-none">play_arrow</span>
              <span>Play All</span>
            </button>
            <button
              type="button"
              aria-label="Shuffle"
              onClick={handleShuffle}
              disabled={songs.length === 0}
              className="px-4 py-2.5 rounded-full bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest disabled:opacity-50 font-label-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer leading-none"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">shuffle</span>
              <span>Shuffle</span>
            </button>
            <button
              type="button"
              aria-label="Rename Playlist"
              onClick={() => setIsRenameOpen(true)}
              className="px-4 py-2.5 rounded-full bg-surface-container-high border border-outline-variant text-on-surface hover:text-primary hover:border-primary/40 font-label-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer leading-none"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">edit</span>
              <span>Rename</span>
            </button>
            <button
              type="button"
              aria-label="Delete Playlist"
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-full bg-surface-container-high border border-outline-variant text-on-surface hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 font-label-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer leading-none"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">delete</span>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Tracks Table */}
      {songs.length === 0 ? (
        <div className="py-16 text-center text-on-surface-variant font-mono text-sm bg-surface-container-low/50 rounded-2xl border border-outline-variant/60">
          This playlist is currently empty. Add tracks from any song table or album!
        </div>
      ) : (
        <TrackTable
          tracks={songs}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayTrack={(track, queue) => playTrack(track, queue)}
          onToggleStar={handleToggleStar}
        />
      )}

      <RenamePlaylistModal
        isOpen={isRenameOpen}
        playlist={playlist}
        onClose={() => setIsRenameOpen(false)}
        onSuccess={(newName) => {
          setPlaylist((prev) => (prev ? { ...prev, name: newName } : null))
        }}
      />
    </div>
  )
}
