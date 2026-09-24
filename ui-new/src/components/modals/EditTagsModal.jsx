import { useState, useEffect } from 'react'
import { nativeMusicApi } from '../../api/nativeMusicApi'
import { showToast } from '../../store/useToastStore'
import Artwork from '../common/Artwork'

export default function EditTagsModal({ isOpen, track, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    year: '',
    genre: '',
    trackNumber: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (track) {
      setFormData({
        title: track.title || '',
        artist: track.artist || '',
        album: track.album || '',
        year: track.year ? String(track.year) : '',
        genre: track.genre || '',
        trackNumber: track.track ? String(track.track) : '',
      })
      setError('')
      setSaving(false)
    }
  }, [track])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !track) {
    return null
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        album: formData.album.trim(),
        year: formData.year.trim(),
        genre: formData.genre.trim(),
        trackNumber: formData.trackNumber.trim(),
      }

      const res = await nativeMusicApi.updateTrackTags(track.id, payload)
      showToast(`Updated tags for "${formData.title || 'Track'}"`, 'success', 'edit_note')
      onSuccess?.(res?.track || payload)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update metadata')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-container-low border border-outline-variant rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-outline-variant/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[22px] leading-none">edit_note</span>
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-on-surface leading-tight">
                Edit Audio Metadata
              </h2>
              <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                ID3 / FLAC Native Taglib Editor
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-7 h-7 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer leading-none"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">close</span>
          </button>
        </div>

        {/* Track Preview Header */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container border border-outline-variant/60">
          <div className="w-11 h-11 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
            <Artwork record={track} size={80} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-on-surface truncate leading-tight">
              {track.title || 'Untitled Track'}
            </p>
            <p className="text-[11px] text-on-surface-variant truncate">
              {track.artist || 'Unknown Artist'} • {track.album || 'Unknown Album'}
            </p>
            <span className="font-mono text-[9px] text-primary">
              Format: {track.suffix ? track.suffix.toUpperCase() : 'AUDIO'}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] leading-none">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Title */}
            <div className="sm:col-span-2 space-y-1">
              <label htmlFor="tag-title" className="block text-[11px] font-mono text-on-surface-variant">
                Track Title
              </label>
              <input
                id="tag-title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                className="w-full h-9 px-3 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Artist */}
            <div className="space-y-1">
              <label htmlFor="tag-artist" className="block text-[11px] font-mono text-on-surface-variant">
                Artist
              </label>
              <input
                id="tag-artist"
                type="text"
                value={formData.artist}
                onChange={(e) => handleChange('artist', e.target.value)}
                required
                className="w-full h-9 px-3 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Album */}
            <div className="space-y-1">
              <label htmlFor="tag-album" className="block text-[11px] font-mono text-on-surface-variant">
                Album
              </label>
              <input
                id="tag-album"
                type="text"
                value={formData.album}
                onChange={(e) => handleChange('album', e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Year */}
            <div className="space-y-1">
              <label htmlFor="tag-year" className="block text-[11px] font-mono text-on-surface-variant">
                Year
              </label>
              <input
                id="tag-year"
                type="number"
                value={formData.year}
                onChange={(e) => handleChange('year', e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Track Number */}
            <div className="space-y-1">
              <label htmlFor="tag-track" className="block text-[11px] font-mono text-on-surface-variant">
                Track Number
              </label>
              <input
                id="tag-track"
                type="number"
                value={formData.trackNumber}
                onChange={(e) => handleChange('trackNumber', e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Genre */}
            <div className="sm:col-span-2 space-y-1">
              <label htmlFor="tag-genre" className="block text-[11px] font-mono text-on-surface-variant">
                Genre
              </label>
              <input
                id="tag-genre"
                type="text"
                value={formData.genre}
                onChange={(e) => handleChange('genre', e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/60">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container font-label-md text-xs font-medium cursor-pointer transition-colors leading-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-primary text-white hover:bg-primary-bright font-label-md text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors leading-none"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin leading-none">
                    sync
                  </span>
                  <span>Writing Tags...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px] leading-none">save</span>
                  <span>Save Metadata</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
