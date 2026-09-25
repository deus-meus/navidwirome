import { useState, useRef, useEffect } from 'react'
import { nativeMusicApi } from '../../api/nativeMusicApi'
import { showToast } from '../../store/useToastStore'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default function UploadModal({ isOpen, onClose, onUploadComplete }) {
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      setFiles([])
      setUploading(false)
      setProgress(0)
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

  if (!isOpen) return null

  const handleFiles = (newFiles) => {
    const validAudio = Array.from(newFiles).map((file) => ({
      file,
      name: file.name,
      size: file.size,
      status: 'ready',
    }))
    setFiles((prev) => [...prev, ...validAudio])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleCommitUpload = async () => {
    if (files.length === 0 || uploading) return
    setUploading(true)
    setProgress(0)

    let successCount = 0
    let failureCount = 0
    const total = files.length

    for (let i = 0; i < total; i++) {
      const item = files[i]
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f))
      )

      try {
        await nativeMusicApi.uploadMusicFile(item.file)
        successCount++
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'done' } : f))
        )
      } catch (err) {
        failureCount++
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'error', error: err.message || 'Upload failed' } : f
          )
        )
      }

      const currentProgress = Math.round(((i + 1) / total) * 100)
      setProgress(currentProgress)
    }

    setUploading(false)

    if (failureCount === 0) {
      showToast(
        `Successfully uploaded ${successCount} audio track${successCount > 1 ? 's' : ''}`,
        'success',
        'cloud_done'
      )
      setTimeout(() => {
        onUploadComplete?.()
        onClose()
      }, 500)
    } else if (successCount > 0) {
      showToast(`Uploaded ${successCount} track(s), but ${failureCount} failed`, 'warning', 'warning')
      onUploadComplete?.()
    } else {
      showToast('Failed to upload audio files', 'error', 'error')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md transition-all"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-surface-container-high rounded-xl p-6 shadow-2xl border border-outline-variant space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                Upload Audio &amp; Batch Tagging
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                FLAC 24-bit, ALAC, WAV, DSD, and High-Bitrate MP3
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close upload modal"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative p-8 rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all ${
            isDragging
              ? 'bg-surface-container-lowest border-primary'
              : 'bg-surface-container-lowest/80 border-outline-variant/60 hover:bg-surface-container-lowest hover:border-primary/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.flac,.wav,.alac,.dsf,.dff,.mp3,.m4a,.ogg,.opus"
            data-testid="file-upload-input"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary transition-transform">
            <span className="material-symbols-outlined text-[26px]">audio_file</span>
          </div>
          <p className="font-medium text-sm text-on-surface pt-1">
            Drag &amp; drop master audio files here
          </p>
          <p className="font-mono text-xs text-on-surface-variant/70">
            Supported containers: .flac, .wav, .alac, .aiff, .dsd (up to 4GB per file)
          </p>
          <span className="mt-1 px-3 py-1 rounded bg-surface-container text-primary font-mono text-xs border border-primary/20">
            Browse Local Storage
          </span>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto py-1">
            {files.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    {item.status === 'done'
                      ? 'check_circle'
                      : item.status === 'uploading'
                      ? 'sync'
                      : item.status === 'error'
                      ? 'error'
                      : 'audiotrack'}
                  </span>
                  <div className="truncate">
                    <p className="text-xs font-medium text-on-surface truncate">{item.name}</p>
                    <p className="font-mono text-[10px] text-on-surface-variant">
                      {formatBytes(item.size)} •{' '}
                      {item.status === 'done'
                        ? 'Uploaded'
                        : item.status === 'uploading'
                        ? 'Uploading...'
                        : item.status === 'error'
                        ? item.error || 'Failed'
                        : 'Ready to Upload'}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-mono text-xs font-semibold px-2 py-0.5 rounded border ${
                    item.status === 'done'
                      ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20'
                      : item.status === 'error'
                      ? 'text-red-400 bg-red-500/15 border-red-500/20'
                      : item.status === 'uploading'
                      ? 'text-primary bg-primary/15 border-primary/20 animate-pulse'
                      : 'text-primary bg-primary/15 border-primary/20'
                  }`}
                >
                  {item.status === 'done'
                    ? 'Done'
                    : item.status === 'error'
                    ? 'Error'
                    : item.status === 'uploading'
                    ? 'Uploading'
                    : 'Ready'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
          <span className="font-mono text-[11px] text-on-surface-variant/80 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
            Direct injection into audiophile FLAC index
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={files.length === 0 || uploading}
              onClick={handleCommitUpload}
              className={`px-5 py-2 rounded-lg text-xs font-semibold shadow-lg transition-all ${
                files.length === 0 || uploading
                  ? 'bg-surface-container text-on-surface-dim cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-bright'
              }`}
            >
              {uploading ? `Uploading (${progress}%)...` : 'Commit to Library'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
