import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import subsonic from '../api/subsonic'
import { nativeMusicApi } from '../api/nativeMusicApi'
import Artwork from '../components/common/Artwork'
import TrackTable from '../components/dashboard/TrackTable'
import RenamePlaylistModal from '../components/modals/RenamePlaylistModal'
import { usePlayerStore } from '../store/usePlayerStore'
import { usePlaylistStore } from '../store/usePlaylistStore'
import { useAuthStore } from '../store/useAuthStore'
import { showConfirm } from '../store/useConfirmStore'
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [coverBust, setCoverBust] = useState(Date.now())
  const [uploadingCover, setUploadingCover] = useState(false)
  const fileInputRef = useRef(null)
  const menuRef = useRef(null)

  const navigate = useNavigate()
  const { currentTrack, isPlaying, playTrack } = usePlayerStore()
  const { deletePlaylist } = usePlaylistStore()
  const { user } = useAuthStore()

  const currentUsername = (user?.username || user?.userName || '').toLowerCase()
  const playlistOwner = (playlist?.owner || '').toLowerCase()
  const isOwner = Boolean(currentUsername && playlistOwner && currentUsername === playlistOwner)
  const canManage = isOwner

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

  // Click outside and Escape key listener for three-dots menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

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
    const confirmed = await showConfirm({
      title: 'Delete Playlist',
      message: `Are you sure you want to delete playlist "${playlist.name}"? This will not delete the underlying audio files.`,
      confirmText: 'Delete Playlist',
      danger: true,
    })
    if (!confirmed) {
      return
    }
    try {
      await deletePlaylist(playlist.id, playlist.name)
      navigate('/playlists')
    } catch (err) {
      console.error('Failed to delete playlist:', err)
    }
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingCover(true)
      await nativeMusicApi.uploadPlaylistImage(playlist.id, file)
      setCoverBust(Date.now())
      showToast('Playlist artwork updated', 'success', 'image')
      await loadDetails()
    } catch (err) {
      showToast(`Error updating cover: ${err.message}`, 'error')
    } finally {
      setUploadingCover(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleResetCover = async () => {
    const confirmed = await showConfirm({
      title: 'Reset Cover Art',
      message: 'Reset custom artwork back to automatic multi-album mosaic?',
      confirmText: 'Reset Artwork',
      danger: false,
    })
    if (!confirmed) return

    try {
      setUploadingCover(true)
      await nativeMusicApi.deletePlaylistImage(playlist.id)
      setCoverBust(Date.now())
      showToast('Playlist artwork reset to default', 'success', 'refresh')
      await loadDetails()
    } catch (err) {
      showToast(`Error resetting cover: ${err.message}`, 'error')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleTogglePublic = async () => {
    if (!playlist?.id) return
    const newPublic = !playlist.public
    try {
      await subsonic.updatePlaylistPublic(playlist.id, newPublic)
      setPlaylist((prev) => (prev ? { ...prev, public: newPublic } : null))
      showToast(
        newPublic ? 'Playlist is now Public' : 'Playlist is now Private',
        'success',
        newPublic ? 'public' : 'lock'
      )
    } catch (err) {
      showToast(`Error updating playlist: ${err.message}`, 'error')
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
        <div className="relative group w-48 h-48 md:w-56 md:h-56 rounded-xl overflow-hidden bg-surface-container-high shadow-2xl flex-shrink-0">
          <Artwork
            record={{ ...playlist, sync: true, coverArt: `pl-${playlist.id}`, _t: coverBust, fallbackTracks: songs }}
            size={400}
            className="w-full h-full object-cover"
          />

          {uploadingCover && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
            </div>
          )}

          {/* Hover Overlay for Changing/Resetting Cover */}
          {canManage && (
            <>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                <button
                  type="button"
                  aria-label="Upload Cover"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-bright text-white text-xs font-medium shadow-md transition-transform hover:scale-105 cursor-pointer leading-none"
                >
                  <span className="material-symbols-outlined text-[16px] leading-none">photo_camera</span>
                  <span>Change Cover</span>
                </button>
                <button
                  type="button"
                  aria-label="Reset Cover"
                  onClick={handleResetCover}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 hover:bg-red-500/20 text-on-surface-variant hover:text-red-400 text-[11px] font-mono border border-white/10 transition-colors cursor-pointer leading-none"
                >
                  <span className="material-symbols-outlined text-[14px] leading-none">delete</span>
                  <span>Reset</span>
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                aria-label="Upload playlist cover file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-mono font-semibold uppercase">
                Curated Playlist
              </div>
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

          {/* Action Transport Buttons & Three-Dots Menu */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <button
              type="button"
              aria-label="Play All"
              onClick={handlePlayAll}
              disabled={songs.length === 0}
              className="px-6 py-2 rounded-xl bg-primary text-white font-label-md text-sm font-bold hover:bg-primary-bright disabled:opacity-50 transition-all shadow-lg flex items-center gap-2 cursor-pointer leading-none"
            >
              <span className="material-symbols-outlined text-[20px] text-white leading-none">play_arrow</span>
              <span>Play All</span>
            </button>
            <button
              type="button"
              aria-label="Shuffle"
              onClick={handleShuffle}
              disabled={songs.length === 0}
              className="px-4 py-2 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest disabled:opacity-50 font-label-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer leading-none"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">shuffle</span>
              <span>Shuffle</span>
            </button>
            {canManage && (
              <div className="relative flex items-center" ref={menuRef}>
                <button
                  type="button"
                  aria-label="Playlist Options"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="w-9 h-9 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 transition-all flex items-center justify-center cursor-pointer leading-none hover:scale-105 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[24px] leading-none">more_horiz</span>
                </button>
                {isMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Playlist options menu"
                    className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-surface-container-high shadow-2xl border border-outline-variant p-1.5 z-40 animate-in fade-in slide-in-from-top-2 space-y-0.5"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      aria-label="Rename Playlist"
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsRenameOpen(true)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-on-surface hover:bg-surface-container transition-colors cursor-pointer leading-none"
                    >
                      <span className="material-symbols-outlined text-[17px] text-on-surface-variant leading-none">
                        edit
                      </span>
                      <span>Rename</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      aria-label={playlist.public ? 'Set playlist to private' : 'Set playlist to public'}
                      onClick={() => {
                        setIsMenuOpen(false)
                        handleTogglePublic()
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-on-surface hover:bg-surface-container transition-colors cursor-pointer leading-none"
                    >
                      <span className="material-symbols-outlined text-[17px] text-on-surface-variant leading-none">
                        {playlist.public ? 'lock' : 'public'}
                      </span>
                      <span>{playlist.public ? 'Make Private' : 'Make Public'}</span>
                    </button>
                    <div className="my-1 border-t border-outline-variant/60" />
                    <button
                      type="button"
                      role="menuitem"
                      aria-label="Delete Playlist"
                      onClick={() => {
                        setIsMenuOpen(false)
                        handleDelete()
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer leading-none"
                    >
                      <span className="material-symbols-outlined text-[17px] leading-none">delete</span>
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            )}
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
