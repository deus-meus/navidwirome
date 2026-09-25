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

  const isPlaylist = Boolean(
    record?.sync !== undefined ||
    record?.isPlaylist ||
    String(record?.coverArt || '').startsWith('pl-') ||
    String(record?.id || '').startsWith('pl-')
  )

  if (!url || hasError) {
    if (record?.fallbackTracks && record.fallbackTracks.length > 0) {
      if (record.fallbackTracks.length >= 4) {
        return (
          <div data-testid="artwork-placeholder" className={`grid grid-cols-2 grid-rows-2 w-full h-full overflow-hidden ${className}`}>
            {record.fallbackTracks.slice(0, 4).map((t, i) => (
              <Artwork key={t.id || i} record={t} size={Math.round(size / 2)} square={square} className="w-full h-full object-cover" />
            ))}
          </div>
        )
      }
      return (
        <div data-testid="artwork-placeholder" className={`w-full h-full overflow-hidden ${className}`}>
          <Artwork record={record.fallbackTracks[0]} size={size} square={square} className="w-full h-full object-cover" />
        </div>
      )
    }

    if (isPlaylist) {
      return (
        <div
          data-testid="artwork-placeholder"
          className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-[#24211e] via-[#1a1816] to-[#121110] border border-white/5 overflow-hidden select-none w-full h-full ${className}`}
        >
          {/* Subtle concentric vinyl record groove rings */}
          <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
            <div className="w-[140%] h-[140%] rounded-full border border-white/20 flex items-center justify-center">
              <div className="w-[80%] h-[80%] rounded-full border border-white/20 flex items-center justify-center">
                <div className="w-[60%] h-[60%] rounded-full border border-white/20 flex items-center justify-center">
                  <div className="w-[40%] h-[40%] rounded-full border border-white/30" />
                </div>
              </div>
            </div>
          </div>

          {/* Center audiophile badge with warm amber accents */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-lg backdrop-blur-xs text-primary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-3xl md:text-4xl text-primary leading-none">queue_music</span>
            </div>
            <span className="mt-2.5 font-mono text-[10px] md:text-[11px] font-bold tracking-widest text-primary/80 uppercase">
              PLAYLIST
            </span>
          </div>
        </div>
      )
    }

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
