import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import subsonic from '../api/subsonic'
import AlbumGrid from '../components/dashboard/AlbumGrid'
import { usePlayerStore } from '../store/usePlayerStore'

export default function ArtistDetailView() {
  const { id } = useParams()
  const [artist, setArtist] = useState(null)
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()
  const { playTrack } = usePlayerStore()

  useEffect(() => {
    setLoading(true)
    subsonic
      .getArtist(id)
      .then((data) => {
        setArtist(data)
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

      {/* Artist Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 rounded-2xl bg-surface-container-low border border-outline-variant shadow-xl">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary shadow-2xl flex-shrink-0">
          <span className="material-symbols-outlined text-[64px]">person</span>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-mono font-semibold uppercase w-fit mx-auto md:mx-0">
            Artist Profile
          </div>
          <h1 className="font-headline-lg text-3xl md:text-5xl font-semibold text-on-surface tracking-tight">
            {artist.name}
          </h1>
          <p className="font-mono text-xs text-on-surface-variant/80 pt-1">
            {albums.length} Releases in Master Library
          </p>
        </div>
      </div>

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
