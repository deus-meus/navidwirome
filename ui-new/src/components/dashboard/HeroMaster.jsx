import Artwork from '../common/Artwork'

export default function HeroMaster({
  album,
  onPlayMaster,
  onAddToLibrary,
  onAddToQueue,
}) {
  const title = album?.name || album?.title || 'Master Spotlight'
  const artist = album?.artist || 'Reference Library'
  const year = album?.year || new Date().getFullYear()
  const genre = album?.genre || 'Lossless Studio'
  const format = album?.suffix ? album.suffix.toUpperCase() : 'FLAC'
  const description =
    album?.comment ||
    `High dynamic range master recording from ${artist}. Pristine acoustic fidelity with organic harmonics directly sourced from reference studio master files.`

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant shadow-2xl p-5 sm:p-6 md:p-8">
      {/* Ambient Backing Glow with Album Art */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15 filter blur-3xl scale-125">
        {album && (
          <Artwork
            record={album}
            size={600}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-background via-surface-container-low/95 to-surface-container-low/80 pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 z-10">
        {/* Left Column: Metadata & Actions */}
        <div className="flex-1 max-w-2xl space-y-3.5 text-left">
          {/* Audiophile Header Badges */}
          <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-2.5">
            <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary/20 text-primary border border-primary/30 font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
              Master Feature
            </span>
            <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-surface-container border border-outline-variant font-mono text-[10px] sm:text-[11px] text-on-surface-variant flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              {format} 24-bit / 96kHz Lossless
            </span>
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-surface-container border border-outline-variant font-mono text-[10px] sm:text-[11px] text-primary font-semibold">
              DR16 Verified
            </span>
          </div>

          {/* Editorial Title & Artist */}
          <div className="space-y-0.5 text-left">
            <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl text-on-surface font-semibold tracking-tight leading-tight">
              {title}
            </h1>
            <p className="font-serif text-sm sm:text-lg md:text-xl text-primary/90 italic font-normal">
              {artist} • {year} Edition • {genre}
            </p>
          </div>

          {/* Description */}
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant/90 leading-relaxed text-left max-w-xl">
            {description}
          </p>

          {/* Interactive Controls */}
          <div className="flex flex-wrap items-center justify-start gap-2.5 sm:gap-3 pt-1 w-full">
            <button
              onClick={() => onPlayMaster?.(album)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-primary text-white font-label-md text-xs sm:text-sm font-bold hover:bg-primary-bright transition-all shadow-xl hover:scale-105 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap flex-shrink-0 leading-none"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-white leading-none">play_arrow</span>
              <span>Play Master</span>
            </button>

            <button
              onClick={() => (onAddToQueue ? onAddToQueue(album) : onAddToLibrary?.(album))}
              className="flex-1 sm:flex-initial px-4.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest hover:text-primary font-label-md text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm whitespace-nowrap flex-shrink-0 leading-none"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px] sm:text-[19px] leading-none">queue_music</span>
              <span>Add to Queue</span>
            </button>
          </div>
        </div>

        {/* Right Column: Audiophile Vinyl Jacket Presentation */}
        <div
          className="relative flex-shrink-0 group cursor-pointer self-start lg:self-auto pt-2 lg:pt-0 ml-0 mr-10 sm:mr-14"
          onClick={() => onPlayMaster?.(album)}
        >
          {/* Vinyl Disc Peeking Out */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-7 sm:translate-x-12 w-36 h-36 sm:w-52 sm:h-52 rounded-full bg-neutral-900 border-2 border-neutral-700 shadow-2xl flex items-center justify-center transition-all duration-500 group-hover:translate-x-11 sm:group-hover:translate-x-16 group-hover:rotate-45">
            {/* Vinyl Grooves */}
            <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-full border border-neutral-700/50 flex items-center justify-center">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border border-neutral-800 flex items-center justify-center">
                {/* Vinyl Label */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/80 border border-neutral-900 flex items-center justify-center shadow-inner">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-neutral-950 border border-neutral-800" />
                </div>
              </div>
            </div>
          </div>

          {/* Album Jacket Sleeve */}
          <div className="relative z-10 w-40 h-40 sm:w-56 sm:h-56 rounded-xl overflow-hidden bg-surface-container-high border border-outline-variant shadow-2xl">
            <Artwork
              record={album}
              size={500}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Vinyl Sheen Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
            <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 font-mono text-[10px] text-white/90">
              Lossless Master
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
