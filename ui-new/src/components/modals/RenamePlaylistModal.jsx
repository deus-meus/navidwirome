import { useState, useEffect, useRef } from 'react'
import { usePlaylistStore } from '../../store/usePlaylistStore'

export default function RenamePlaylistModal({ isOpen, playlist, onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const { renamePlaylist } = usePlaylistStore()

  useEffect(() => {
    if (isOpen && playlist) {
      setName(playlist.name || '')
      setError(null)
      setSubmitting(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, playlist])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !playlist) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      await renamePlaylist(playlist.id, name.trim())
      setSubmitting(false)
      onSuccess?.(name.trim())
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to rename playlist')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-surface-container-high rounded-2xl p-6 shadow-2xl border border-outline-variant space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary leading-none">
              <span className="material-symbols-outlined text-[20px] leading-none">edit</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                Rename Playlist
              </h3>
              <p className="font-mono text-[11px] text-on-surface-variant">
                Update collection title
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="rename-playlist-input" className="block text-xs font-medium text-on-surface-variant">
              New Title
            </label>
            <input
              id="rename-playlist-input"
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-highest text-on-surface text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-bright disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md cursor-pointer flex items-center gap-1.5 leading-none"
            >
              {submitting ? 'Saving...' : 'Save Title'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
