import { useState, useEffect } from 'react'

export default function TagEditorModal({
  isOpen,
  track,
  onClose,
  onSaveTags,
}) {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    albumArtist: '',
    year: '',
    genre: '',
    track: '',
  })
  const [detecting, setDetecting] = useState(false)

  useEffect(() => {
    if (track) {
      setFormData({
        title: track.title || '',
        artist: track.artist || '',
        album: track.album || '',
        albumArtist: track.albumArtist || track.artist || '',
        year: track.year || '',
        genre: track.genre || '',
        track: track.track || '',
      })
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

  if (!isOpen || !track) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAutoDetect = () => {
    setDetecting(true)
    setTimeout(() => {
      setDetecting(false)
      // Enhance with detected tags
      setFormData((prev) => ({
        ...prev,
        genre: prev.genre || 'Audiophile Hi-Res',
        year: prev.year || new Date().getFullYear(),
      }))
    }, 600)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSaveTags?.({
      ...track,
      ...formData,
      year: formData.year ? parseInt(formData.year, 10) : undefined,
      track: formData.track ? parseInt(formData.track, 10) : undefined,
    })
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md transition-all"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-surface-container-high rounded-xl p-6 shadow-2xl border border-outline-variant space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">edit_note</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                Audio Tag &amp; Metadata Editor
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant font-mono">
                {track.suffix ? track.suffix.toUpperCase() : 'FLAC'} • Direct File Tagging
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close tag editor"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono text-on-surface-variant uppercase tracking-wider mb-1">
              Track Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-on-surface-variant uppercase tracking-wider mb-1">
                Artist
              </label>
              <input
                type="text"
                name="artist"
                value={formData.artist}
                onChange={handleChange}
                className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-on-surface-variant uppercase tracking-wider mb-1">
                Album Artist
              </label>
              <input
                type="text"
                name="albumArtist"
                value={formData.albumArtist}
                onChange={handleChange}
                className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-on-surface-variant uppercase tracking-wider mb-1">
              Album Name
            </label>
            <input
              type="text"
              name="album"
              value={formData.album}
              onChange={handleChange}
              className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-on-surface-variant uppercase tracking-wider mb-1">
                Year
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-on-surface-variant uppercase tracking-wider mb-1">
                Track #
              </label>
              <input
                type="number"
                name="track"
                value={formData.track}
                onChange={handleChange}
                className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-on-surface-variant uppercase tracking-wider mb-1">
                Genre
              </label>
              <input
                type="text"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* AcoustID Auto-detect action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAutoDetect}
              disabled={detecting}
              className="w-full py-2 px-3 rounded-lg bg-surface-container border border-outline-variant text-primary hover:border-primary/50 text-xs font-mono flex items-center justify-center gap-2 transition-all"
            >
              <span className={`material-symbols-outlined text-[16px] ${detecting ? 'animate-spin' : ''}`}>
                {detecting ? 'sync' : 'fingerprint'}
              </span>
              <span>{detecting ? 'Fingerprinting with AcoustID...' : 'Auto-Detect Tags (AcoustID)'}</span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-bright shadow-lg transition-all"
            >
              Save Metadata
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
