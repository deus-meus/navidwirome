import { useState } from 'react'
import subsonic from '../../api/subsonic'

export default function Artwork({ record, size = 300, square = true, className = '', alt = 'Album Artwork' }) {
  const [hasError, setHasError] = useState(false)
  const [prevUrl, setPrevUrl] = useState('')
  const url = record ? subsonic.getCoverArtUrl(record, size, square) : ''

  if (url !== prevUrl) {
    setPrevUrl(url)
    setHasError(false)
  }

  if (!url || hasError) {
    return (
      <div
        data-testid="artwork-placeholder"
        className={`flex items-center justify-center bg-surface-container-high text-on-surface-dim ${className}`}
      >
        <span className="material-symbols-outlined text-[28px] opacity-40">album</span>
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
    />
  )
}
