import Artwork from '../common/Artwork'

export default function HeroMaster({
  album,
  onPlayMaster,
  onAddToLibrary,
}) {
  const title = album?.name || album?.title || 'Master Spotlight'
  const artist = album?.artist || 'Reference Library'
  const year = album?.year || new Date().getFullYear()
  const genre = album?.genre || 'Lossless Studio'
  const format = album?.suffix ? album.suffix.toUpperCase() : 'FLAC'
  const description =
    album?.comment ||
    `High dynamic range master recording from ${artist}. Pristine audio fidelity with organic acoustic textures and warm harmonics directly from reference library master files.`

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant shadow-xl">
      {/* Ambient Backing Art with Deep Linear Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 filter blur-xl scale-110">
        {album && (
          <Artwork
            record={album}
            size={600}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-background via-surface-container-low/95 to-transparent pointer-events-none" />

      <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-label-sm text-xs font-bold tracking-wider uppercase">
              Master Feature
            </span>
            <span className="font-label-sm text-xs text-primary flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              {format} 24-bit / 96kHz Lossless
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="font-headline-lg text-3xl md:text-4xl text-on-surface font-semibold tracking-tight leading-tight">
              {title}
            </h1>
            <p className="font-body-md text-base text-on-surface-variant font-normal">
              {artist} • {year} Edition • {genre}
            </p>
          </div>

          <p className="font-body-sm text-sm text-on-surface-variant/90 leading-relaxed max-w-lg">
            {description}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onPlayMaster?.(album)}
              className="px-6 py-2 rounded-full bg-primary text-white font-label-md text-sm font-bold hover:bg-primary-bright transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px] text-white">play_arrow</span>
              <span>Play Master</span>
            </button>
            <button
              onClick={() => onAddToLibrary?.(album)}
              className="px-4 py-2 rounded-full bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest font-label-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">library_add</span>
              <span>Add to Library</span>
            </button>
          </div>
        </div>

        {/* Small Real-Time Audio Signal Spectrum Graph */}
        <div className="hidden lg:flex flex-col gap-2 p-4 rounded-xl bg-surface-container-lowest/90 border border-outline-variant backdrop-blur-md w-72">
          <div className="flex items-center justify-between font-label-sm text-xs text-on-surface-variant">
            <span>Spectrum Density</span>
            <span className="font-tabular-data text-primary font-semibold">DR16 Verified</span>
          </div>
          {/* Inline Sparkline / Audio Wave Visualizer */}
          <svg className="w-full h-16 text-primary" fill="none" viewBox="0 0 200 60">
            <path
              d="M0 45 L15 42 L30 50 L45 28 L60 38 L75 14 L90 30 L105 8 L120 22 L135 12 L150 25 L165 18 L180 34 L200 20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <path
              d="M0 45 L15 42 L30 50 L45 28 L60 38 L75 14 L90 30 L105 8 L120 22 L135 12 L150 25 L165 18 L180 34 L200 20 L200 60 L0 60 Z"
              fill="currentColor"
              fillOpacity="0.15"
            />
          </svg>
          <div className="flex items-center justify-between font-tabular-data text-[10px] text-on-surface-variant/60">
            <span>20 Hz</span>
            <span>1 kHz</span>
            <span>48 kHz</span>
          </div>
        </div>
      </div>
    </div>
  )
}
