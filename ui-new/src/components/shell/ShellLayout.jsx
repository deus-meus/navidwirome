import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import PlayerBar from './PlayerBar'
import RightPanel from './RightPanel'
import SearchModal from '../search/SearchModal'
import { useUIStore } from '../../store/useUIStore'
import { usePlayerStore } from '../../store/usePlayerStore'

export default function ShellLayout({ children }) {
  const { isRightPanelOpen, isSearchOpen, openSearch, closeSearch } = useUIStore()
  const { playTrack } = usePlayerStore()
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openSearch])

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-on-surface flex flex-col">
      <Sidebar />
      <Header />
      <main
        className={`pt-16 pb-[76px] pl-[240px] h-full overflow-y-auto transition-all ${
          isRightPanelOpen ? 'pr-[320px]' : 'pr-0'
        }`}
      >
        <div className="p-8 max-w-7xl mx-auto w-full">{children}</div>
      </main>
      <RightPanel />
      <PlayerBar />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onSelectTrack={(track, queue) => playTrack(track, queue)}
        onSelectAlbum={(album) => navigate(`/albums/${album.id}`)}
        onSelectArtist={(artist) => navigate(`/artists/${artist.id}`)}
      />
    </div>
  )
}
