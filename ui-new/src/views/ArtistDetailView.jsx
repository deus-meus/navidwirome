import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import subsonic from '../api/subsonic'
import AlbumGrid from '../components/dashboard/AlbumGrid'
import { usePlayerStore } from '../store/usePlayerStore'

export default function ArtistDetailView() {
  const { id } = useParams()
  const [artist, setArtist] = useState(null)
  const [artistInfo, setArtistInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showFullBio, setShowFullBio] = useState(false)

  const navigate = useNavigate()
  const { playTrack } = usePlayerStore()

  useEffect(() => {
    setLoading(true)
    Promise.all([
      subsonic.getArtist(id),
      subsonic.getArtistInfo(id),
    ])
      .then(([artistData, infoData]) => {
        setArtist(artistData)
        setArtistInfo(infoData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load artist details:', err)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center text-primary">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="py-20 text-center text-on-surface-variant font-mono text-sm">
        Artist not found.
      </div>
    )
  }

  const albums = (artist.album || []).map((alb) => ({
    ...alb,
    artist: artist.name,
  }))

  const handlePlayAlbum = async (album) => {
    try {
      const fullAlbum = await subsonic.getAlbum(album.id)
      const songs = fullAlbum?.song || []
      if (songs.length > 0) {
        playTrack(songs[0], songs)
      }
    } catch (err) {
      console.error('Failed to play album:', err)
    }
  }

  const artistImageUrl =
    artistInfo?.largeImageUrl ||
    artistInfo?.mediumImageUrl ||
    subsonic.getCoverArtUrl(`ar-${id}`, 400, true)

  const biography = artistInfo?.biography || ''
  const similarArtists = artistInfo?.similarArtist || []

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
        <Link to="/artists" className="hover:text-primary transition-colors">
          Artists
        </Link>
        <span>/</span>
        <span className="text-on-surface truncate">{artist.name}</span>
      </div>

      {/* Artist Profile Header Banner */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 md:p-8 rounded-2xl bg-surface-container-low border border-outline-variant shadow-xl relative overflow-hidden">
        {/* Ambient Blur Background */}
        <div className="absolute inset-0 opacity-10 filter blur-3xl scale-125 pointer-events-none">
          <img
            src={artistImageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </div>

        {/* Artist Photo */}
        <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-surface-container-high border border-outline-variant overflow-hidden shadow-2xl flex-shrink-0 relative z-10">
          <img
            src={artistImageUrl}
            alt={artist.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.parentElement.innerHTML =
                '<div class="w-full h-full flex items-center justify-center text-primary"><span class="material-symbols-outlined text-[64px]">person</span></div>'
            }}
          />
        </div>

        {/* Artist Metadata & External Links */}
        <div className="flex-1 flex flex-col justify-center space-y-3 text-center md:text-left relative z-10">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-mono font-semibold uppercase">
              Artist Profile
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container border border-outline-variant text-xs font-mono text-on-surface-variant">
              {albums.length} Master Releases
            </span>
          </div>

          <h1 className="font-serif text-3xl md:text-5xl font-semibold text-on-surface tracking-tight">
            {artist.name}
          </h1>

          {/* External Links */}
          <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
            {artistInfo?.lastFmUrl && (
              <a
                href={artistInfo.lastFmUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs text-on-surface-variant hover:text-primary transition-colors font-mono"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                <span>Last.fm</span>
              </a>
            )}
            {artistInfo?.musicBrainzId && (
              <a
                href={`https://musicbrainz.org/artist/${artistInfo.musicBrainzId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs text-on-surface-variant hover:text-primary transition-colors font-mono"
              >
                <span className="material-symbols-outlined text-[16px]">link</span>
                <span>MusicBrainz</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Biography Section */}
      {biography && (
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-outline-variant">
            <span className="material-symbols-outlined text-primary text-[20px]">menu_book</span>
            <h3 className="font-headline-sm text-base font-semibold text-on-surface">
              Biography &amp; Background
            </h3>
          </div>

          <div className="text-sm text-on-surface-variant leading-relaxed">
            <p className={showFullBio ? '' : 'line-clamp-4'}>
              {biography.replace(/<[^>]+>/g, '')}
            </p>
            {biography.length > 300 && (
              <button
                type="button"
                onClick={() => setShowFullBio(!showFullBio)}
                className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                {showFullBio ? 'Show less' : 'Read full biography'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Similar Artists */}
      {similarArtists.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-headline-sm text-base font-semibold text-on-surface">
            Similar Artists &amp; Related Performers
          </h3>
          <div className="flex flex-wrap gap-2">
            {similarArtists.map((sim) => (
              <button
                key={sim.id || sim.name}
                type="button"
                onClick={() => sim.id && navigate(`/artists/${sim.id}`)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant hover:bg-surface-container hover:border-primary/40 text-xs font-medium text-on-surface transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                <span>{sim.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Artist Discography Grid */}
      <div className="space-y-3">
        <h2 className="font-headline-sm text-xl font-semibold text-on-surface tracking-tight">
          Discography &amp; Releases
        </h2>
        {albums.length === 0 ? (
          <p className="py-8 text-center text-on-surface-variant text-sm font-mono">
            No albums found for this artist.
          </p>
        ) : (
          <AlbumGrid
            albums={albums}
            title=""
            subtitle=""
            onPlayAlbum={handlePlayAlbum}
            onSelectAlbum={(alb) => navigate(`/albums/${alb.id}`)}
          />
        )}
      </div>
    </div>
  )
}
