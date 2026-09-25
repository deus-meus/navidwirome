import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import PlayerBar from './PlayerBar'
import RightPanel from './RightPanel'
import SearchModal from '../search/SearchModal'
import UploadModal from '../modals/UploadModal'
import EditTagsModal from '../modals/EditTagsModal'
import SettingsModal from '../modals/SettingsModal'
import ConfirmModal from '../modals/ConfirmModal'
import ToastContainer from '../common/ToastContainer'
import { useUIStore } from '../../store/useUIStore'
import { usePlayerStore } from '../../store/usePlayerStore'

export default function ShellLayout({ children }) {
  const {
    isRightPanelOpen,
    isSidebarCollapsed,
    isSearchOpen,
    openSearch,
    closeSearch,
    isUploadOpen,
    closeUpload,
    tagEditorTrack,
    closeTagEditor,
    isSettingsOpen,
    closeSettings,
  } = useUIStore()
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
        className={`pt-16 pb-[128px] md:pb-[76px] ${
          isSidebarCollapsed ? 'pl-0 md:pl-16' : 'pl-0 md:pl-[240px]'
        } h-full overflow-y-auto transition-all ${
          isRightPanelOpen ? 'pr-0 md:pr-[320px]' : 'pr-0 md:pr-16'
        }`}
      >
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">{children}</div>
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

      <UploadModal
        isOpen={isUploadOpen}
        onClose={closeUpload}
        onUploadComplete={() => {}}
      />

      <EditTagsModal
        isOpen={Boolean(tagEditorTrack)}
        track={tagEditorTrack}
        onClose={closeTagEditor}
        onSuccess={() => {
          closeTagEditor()
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
      />

      <ConfirmModal />

      <ToastContainer />
    </div>
  )
}
