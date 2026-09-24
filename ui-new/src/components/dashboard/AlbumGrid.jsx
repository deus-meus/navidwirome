import Artwork from '../common/Artwork'

export default function AlbumGrid({
  albums = [],
  title = 'Recent Albums & Acquisitions',
  subtitle = 'Hi-Res catalog synchronizations from personal storage',
  onPlayAlbum,
  onSelectAlbum,
}) {
  if (!albums || albums.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="font-headline-sm text-lg md:text-xl text-on-surface font-semibold tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="font-body-sm text-xs md:text-sm text-on-surface-variant">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {albums.map((album) => {
          const format = album.suffix ? album.suffix.toUpperCase() : 'FLAC'
          const quality = album.samplingRate
            ? `${Math.round(album.samplingRate / 1000)}/${album.bitDepth || 24}`
            : '96/24'

          return (
            <div
              key={album.id}
              onClick={() => onSelectAlbum?.(album)}
              className="group flex flex-col gap-2 p-2 rounded-xl bg-surface-container-low border border-outline-variant hover:bg-surface-container hover:border-primary/30 transition-all cursor-pointer"
            >
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-surface-container-high shadow-md">
                <Artwork
                  record={album}
                  size={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 border border-outline-variant backdrop-blur font-label-sm text-[10px] text-primary font-semibold">
                  {quality}
                </div>
                <button
                  type="button"
                  aria-label="Play album"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPlayAlbum?.(album)
                  }}
                  className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-105"
                >
                  <span className="material-symbols-outlined text-[22px]">play_arrow</span>
                </button>
              </div>

              <div className="space-y-0.5 pt-1">
                <h3 className="font-body-md text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                  {album.name || album.title}
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant truncate">
                  {album.artist}
                </p>
                <div className="flex items-center gap-1.5 font-label-sm text-[11px] text-on-surface-variant/60 pt-0.5">
                  {album.year && <span>{album.year}</span>}
                  {album.year && <span>•</span>}
                  <span>{format}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
