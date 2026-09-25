import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import subsonic from '../api/subsonic'
import Artwork from '../components/common/Artwork'
import CreatePlaylistModal from '../components/modals/CreatePlaylistModal'
import RenamePlaylistModal from '../components/modals/RenamePlaylistModal'
import { usePlayerStore } from '../store/usePlayerStore'
import { usePlaylistStore } from '../store/usePlaylistStore'
import { useAuthStore } from '../store/useAuthStore'
import { showConfirm } from '../store/useConfirmStore'

function formatDuration(seconds) {
  if (!seconds) return '0 min'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins} min`
}

export default function PlaylistsView() {
  const [searchFilter, setSearchFilter] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState(null)

  const navigate = useNavigate()
  const { playTrack } = usePlayerStore()
  const { playlists, loading, fetchPlaylists, deletePlaylist } = usePlaylistStore()
  const { user } = useAuthStore()
  const currentUsername = (user?.username || user?.userName || '').toLowerCase()

  useEffect(() => {
    fetchPlaylists()
  }, [fetchPlaylists])

  const handlePlayPlaylist = async (pl, e) => {
    e?.stopPropagation()
    try {
      const data = await subsonic.getPlaylist(pl.id)
      const songs = data?.entry || []
      if (songs.length > 0) {
        playTrack(songs[0], songs)
      }
    } catch (err) {
      console.error('Failed to play playlist:', err)
    }
  }

  const handleDeletePlaylist = async (pl, e) => {
    e?.stopPropagation()
    const confirmed = await showConfirm({
      title: 'Delete Playlist',
      message: `Are you sure you want to delete playlist "${pl.name}"? This cannot be undone.`,
      confirmText: 'Delete Playlist',
      danger: true,
    })
    if (!confirmed) {
      return
    }
    await deletePlaylist(pl.id, pl.name)
  }

  const handleRenamePlaylist = (pl, e) => {
    e?.stopPropagation()
    setRenameTarget(pl)
  }

  const filtered = playlists.filter((pl) => {
    if (!searchFilter.trim()) return true
    return pl.name?.toLowerCase().includes(searchFilter.toLowerCase())
  })

  return (
    <div className="space-y-6 select-none">
      {/* Header, Search Filter, and Create Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant">
        <div>
          <h1 className="font-headline-lg text-2xl md:text-3xl font-semibold text-on-surface tracking-tight">
            User Playlists
          </h1>
          <p className="font-body-sm text-xs md:text-sm text-on-surface-variant">
            Custom listening queues, mixtape sessions, and catalog collections
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-full md:w-64 relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-[18px] leading-none pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter playlists..."
              className="w-full h-9 pl-8 pr-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {playlists.length > 0 && (
            <button
              type="button"
              aria-label="Create Playlist"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-bright transition-all shadow-md flex-shrink-0 cursor-pointer leading-none"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">add</span>
              <span>Create Playlist</span>
            </button>
          )}
        </div>
      </div>

      {loading && playlists.length === 0 ? (
        <div className="py-20 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl">queue_music</span>
          </div>
          <div className="space-y-1">
            <h3 className="font-headline-sm text-base font-semibold text-on-surface">
              No playlists found
            </h3>
            <p className="font-body-sm text-xs text-on-surface-variant max-w-sm">
              Create your first mixtape or curated collection to organize your favorite studio tracks.
            </p>
          </div>
          <button
            type="button"
            aria-label="Create Playlist"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-5 h-9 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-bright transition-all shadow-md cursor-pointer leading-none"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">add</span>
            <span>Create First Playlist</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((pl) => {
            const isOwner = Boolean(
              currentUsername && pl.owner && currentUsername === pl.owner.toLowerCase()
            )
            const canManage = isOwner

            return (
              <div
                key={pl.id}
                onClick={() => navigate(`/playlists/${pl.id}`)}
                className="group relative flex flex-col gap-2 p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant hover:bg-surface-container hover:border-primary/40 transition-all cursor-pointer shadow-sm hover:shadow-lg"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-surface-container-high shadow-md">
                  <Artwork
                    record={{ ...pl, sync: true }}
                    size={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Overlay Action Buttons on Hover */}
                  {canManage && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        title="Rename playlist"
                        aria-label={`Rename ${pl.name}`}
                        onClick={(e) => handleRenamePlaylist(pl, e)}
                        className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white hover:text-primary hover:bg-black/80 flex items-center justify-center transition-all cursor-pointer leading-none"
                      >
                        <span className="material-symbols-outlined text-[15px] leading-none">edit</span>
                      </button>
                      <button
                        type="button"
                        title="Delete playlist"
                        aria-label={`Delete ${pl.name}`}
                        onClick={(e) => handleDeletePlaylist(pl, e)}
                        className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white hover:text-red-400 hover:bg-black/80 flex items-center justify-center transition-all cursor-pointer leading-none"
                      >
                        <span className="material-symbols-outlined text-[15px] leading-none">delete</span>
                      </button>
                    </div>
                  )}

                  {/* Play Button */}
                  <button
                    type="button"
                    title="Play playlist"
                    aria-label={`Play ${pl.name}`}
                    onClick={(e) => handlePlayPlaylist(pl, e)}
                    className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-105 cursor-pointer leading-none"
                  >
                    <span className="material-symbols-outlined text-[22px] leading-none">play_arrow</span>
                  </button>
                </div>

                <div className="space-y-0.5 pt-1 px-1">
                  <h3 className="font-body-md text-xs font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                    {pl.name}
                  </h3>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-on-surface-variant/70 pt-0.5">
                    <span>{pl.songCount || 0} tracks</span>
                    <span>•</span>
                    <span>{formatDuration(pl.duration)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CreatePlaylistModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newPl) => {
          if (newPl?.id) navigate(`/playlists/${newPl.id}`)
        }}
      />

      <RenamePlaylistModal
        isOpen={Boolean(renameTarget)}
        playlist={renameTarget}
        onClose={() => setRenameTarget(null)}
      />
    </div>
  )
}
