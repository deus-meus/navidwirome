import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store/useUIStore'
import { useAuthStore } from '../../store/useAuthStore'

export default function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const {
    activeTab,
    setActiveTab,
    isRightPanelOpen,
    isSidebarCollapsed,
    openUpload,
    openSearch,
    setActivePanelTab,
    openRightPanel,
  } = useUIStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const canUpload = user ? Boolean(user.isAdmin || user.canUpload) : true

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'queue', label: 'Up Next' },
    { id: 'history', label: 'History' },
  ]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false)
      }
    }
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isProfileOpen])

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    navigate('/')
  }

  return (
    <header
      className={`fixed top-0 left-0 ${
        isSidebarCollapsed ? 'md:left-16' : 'md:left-[240px]'
      } h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant z-20 flex items-center justify-between px-3 sm:px-6 select-none transition-all ${
        isRightPanelOpen ? 'right-0 md:right-[320px]' : 'right-0 md:right-16'
      }`}
    >
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 mr-2">
        {/* Mobile Brand Logo */}
        <div className="flex md:hidden items-center gap-1.5 mr-0.5 flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-xl bg-surface-container-low border border-primary/20 flex items-center justify-center text-primary shadow-sm hover:border-primary/40 transition-all">
            <span className="material-symbols-outlined text-[20px]">graphic_eq</span>
          </div>
          <span className="font-serif text-sm font-semibold tracking-tight text-on-surface leading-none hidden xs:inline whitespace-nowrap">
            Navidwirome
          </span>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <button
            type="button"
            aria-label="Go forward"
            onClick={() => navigate(1)}
            className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
        <div className="h-4 w-px bg-outline-variant mx-0.5 sm:mx-1 flex-shrink-0" />
        <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar scrollbar-none min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`px-2 sm:px-3 py-1 rounded-lg text-xs transition-colors font-medium cursor-pointer whitespace-nowrap flex-shrink-0 focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 ${
                activeTab === tab.id
                  ? 'bg-surface-container text-on-surface font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0" ref={profileRef}>
        {/* Mobile Quick Search Button */}
        <button
          type="button"
          aria-label="Search"
          onClick={openSearch}
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
        </button>

        {/* Upload Music Action */}
        {canUpload && (
          <button
            type="button"
            aria-label="Upload Music"
            onClick={openUpload}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 hover:border-primary/40 text-xs font-semibold transition-all cursor-pointer shadow-sm group"
          >
            <span className="material-symbols-outlined text-[17px] group-hover:scale-110 transition-transform">
              cloud_upload
            </span>
            <span className="hidden sm:inline">Upload Music</span>
          </button>
        )}

        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container border border-outline-variant">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="font-mono text-[10px] text-on-surface font-medium uppercase tracking-wider">
            Direct Stream
          </span>
        </div>

        {/* User Profile Avatar Trigger (Mobile Only) */}
        <button
          type="button"
          aria-label="Open User Profile"
          title={user?.username || 'Profile Menu'}
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="md:hidden w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold shadow-sm hover:scale-105 transition-transform cursor-pointer leading-none flex-shrink-0"
        >
          <span className="leading-none select-none">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
          </span>
        </button>

        {/* User Profile Dropdown Popover (Mobile Only) */}
        {isProfileOpen && (
          <div
            role="menu"
            aria-label="User Profile Dropdown"
            className="md:hidden absolute top-14 right-3 sm:right-6 w-56 bg-surface-container-high border border-outline-variant rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 space-y-0.5"
          >
            {/* User Info Header */}
            <div className="px-3 py-2 border-b border-outline-variant/60 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 leading-none select-none">
                <span className="leading-none text-center">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-on-surface truncate leading-tight">
                  {user?.name || user?.username || 'Audiophile'}
                </p>
                <p className="text-[10px] font-mono text-primary truncate">
                  {user?.isAdmin ? 'Administrator' : 'Standard Listener'}
                </p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="pt-1 space-y-0.5">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsProfileOpen(false)
                  navigate('/settings')
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[17px] text-on-surface-variant group-hover:text-primary transition-colors leading-none">
                    settings
                  </span>
                  <span>Settings</span>
                </div>
                <span className="material-symbols-outlined text-[15px] text-on-surface-variant/60 group-hover:text-on-surface leading-none">
                  chevron_right
                </span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsProfileOpen(false)
                  setActivePanelTab('queue')
                  openRightPanel()
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[17px] text-on-surface-variant group-hover:text-primary transition-colors leading-none">
                    queue_music
                  </span>
                  <span>Playback Queue</span>
                </div>
                <span className="material-symbols-outlined text-[15px] text-on-surface-variant/60 group-hover:text-on-surface leading-none">
                  chevron_right
                </span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsProfileOpen(false)
                  navigate('/playlists')
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[17px] text-on-surface-variant group-hover:text-primary transition-colors leading-none">
                    playlist_play
                  </span>
                  <span>User Playlists</span>
                </div>
                <span className="material-symbols-outlined text-[15px] text-on-surface-variant/60 group-hover:text-on-surface leading-none">
                  chevron_right
                </span>
              </button>

              <div className="my-1 border-t border-outline-variant/60" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsProfileOpen(false)
                  logout()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer leading-none"
              >
                <span className="material-symbols-outlined text-[17px] leading-none">logout</span>
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
