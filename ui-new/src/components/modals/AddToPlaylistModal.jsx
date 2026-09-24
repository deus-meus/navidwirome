import { useState, useEffect } from 'react'
import subsonic from '../../api/subsonic'
import { usePlaylistStore } from '../../store/usePlaylistStore'
import { showToast } from '../../store/useToastStore'

export default function AddToPlaylistModal({ isOpen, track, onClose }) {
  const [playlists, setPlaylists] = useState([])
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setError(null)
      setNewPlaylistName('')
      subsonic
        .getPlaylists()
        .then((data) => {
          setPlaylists(data || [])
          setLoading(false)
        })
        .catch((err) => {
          console.error('Failed to load playlists:', err)
          setLoading(false)
        })
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

  if (!isOpen || !track) return null

  const handleSelectPlaylist = async (playlist) => {
    setSubmitting(true)
    setError(null)
    try {
      await subsonic.addToPlaylist(playlist.id, track.id)
      await usePlaylistStore.getState().fetchPlaylists()
      showToast(`Added "${track.title}" to ${playlist.name}`, 'success', 'playlist_add')
      setSubmitting(false)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to add to playlist')
      setSubmitting(false)
    }
  }

  const handleCreateAndAdd = async (e) => {
    e.preventDefault()
    if (!newPlaylistName.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      await subsonic.createPlaylist(null, newPlaylistName.trim(), [track.id])
      await usePlaylistStore.getState().fetchPlaylists()
      showToast(`Created "${newPlaylistName.trim()}" and added "${track.title}"`, 'success', 'playlist_add')
      setSubmitting(false)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create playlist')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-surface-container-high rounded-2xl p-6 shadow-2xl border border-outline-variant space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary leading-none">
              <span className="material-symbols-outlined text-[20px] leading-none">playlist_add</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                Add to Playlist
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant truncate max-w-[240px]">
                {track.title} • {track.artist}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer leading-none"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Create New Playlist Form */}
        <form onSubmit={handleCreateAndAdd} className="flex gap-2">
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="New playlist name..."
            className="flex-1 h-9 px-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!newPlaylistName.trim() || submitting}
            className="px-3.5 h-9 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Create &amp; Add</span>
          </button>
        </form>

        <div className="pt-1">
          <p className="text-[11px] font-mono text-on-surface-variant uppercase tracking-wider mb-2">
            Select Existing Playlist
          </p>

          <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
            {loading ? (
              <div className="py-6 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl animate-spin">
                  progress_activity
                </span>
              </div>
            ) : playlists.length === 0 ? (
              <p className="text-center py-4 text-xs text-on-surface-variant italic">
                No playlists yet. Create one above!
              </p>
            ) : (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSelectPlaylist(pl)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 hover:border-primary/40 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary transition-colors">
                      queue_music
                    </span>
                    <span className="text-xs font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                      {pl.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-on-surface-variant">
                    {pl.songCount || 0} tracks
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
