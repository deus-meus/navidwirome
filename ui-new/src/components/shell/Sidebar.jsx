import { useEffect, useState, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useUIStore } from '../../store/useUIStore'
import { usePlaylistStore } from '../../store/usePlaylistStore'
import CreatePlaylistModal from '../modals/CreatePlaylistModal'

export default function Sidebar() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const { user, logout } = useAuthStore()
  const { openSearch, setActivePanelTab } = useUIStore()
  const { playlists, fetchPlaylists } = usePlaylistStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchPlaylists()
  }, [fetchPlaylists])

  // Click outside listener for profile popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isProfileMenuOpen])

  const handleCreatePlaylist = () => {
    setIsCreateOpen(true)
  }

  const navItems = [
    { to: '/', label: 'Discover', icon: 'explore' },
    { to: '/albums', label: 'Albums', icon: 'album' },
    { to: '/artists', label: 'Artists', icon: 'person' },
    { to: '/songs', label: 'Songs', icon: 'audiotrack' },
    { to: '/playlists', label: 'Playlists', icon: 'queue_music' },
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-[76px] w-[240px] bg-surface-container-lowest border-r border-outline-variant flex flex-col z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center gap-2.5 border-b border-outline-variant">
        <div className="w-8 h-8 rounded-lg bg-surface-container-low border border-primary/20 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[20px]">graphic_eq</span>
        </div>
        <div className="flex flex-col">
          <span className="font-serif text-base tracking-tight text-on-surface leading-tight font-semibold">
            Navidwirome
          </span>
          <span className="font-mono text-[10px] text-primary uppercase tracking-wider font-semibold">
            Studio v2.4
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div
          onClick={openSearch}
          className="relative flex items-center cursor-pointer group"
        >
          <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-[18px] pointer-events-none group-hover:text-primary transition-colors">
            search
          </span>
          <input
            type="text"
            readOnly
            onClick={openSearch}
            placeholder="Search catalog (Cmd+K)"
            className="w-full h-9 pl-8 pr-2 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant text-xs focus:outline-none focus:border-primary transition-colors font-sans cursor-pointer group-hover:border-primary/40"
          />
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
        <nav className="space-y-1">
          <div className="px-2 pb-1 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant/70">
            Library
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium ${
                  isActive
                    ? 'bg-surface-container-high text-primary font-semibold border border-primary/20'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Playlists */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant/70">
              User Playlists
            </span>
            <button
              type="button"
              aria-label="Create playlist"
              onClick={handleCreatePlaylist}
              className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
          <div className="space-y-0.5">
            {playlists.length === 0 ? (
              <p className="px-2 py-1 text-[11px] text-on-surface-dim italic">No playlists yet</p>
            ) : (
              playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => navigate(`/playlists/${pl.id}`)}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface text-xs cursor-pointer group"
                >
                  <span className="truncate">{pl.name}</span>
                  <span className="font-mono text-[10px] text-on-surface-dim group-hover:text-primary">
                    {pl.songCount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Status Bar & Profile Flyout Menu (Image #58) */}
      <div className="relative p-3 border-t border-outline-variant bg-surface-container-lowest/90" ref={profileMenuRef}>
        {/* Floating Context Popover Menu */}
        {isProfileMenuOpen && (
          <div
            role="menu"
            aria-label="User Profile Menu"
            className="absolute bottom-16 left-3 right-3 bg-surface-container-high border border-outline-variant rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 space-y-0.5"
          >
            {/* User Info Header */}
            <div className="px-3 py-2 border-b border-outline-variant/60 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 leading-none">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
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
                  setIsProfileMenuOpen(false)
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
                  setIsProfileMenuOpen(false)
                  setActivePanelTab('queue')
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
                  setIsProfileMenuOpen(false)
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
                  setIsProfileMenuOpen(false)
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

        <div
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className={`flex items-center justify-between p-1.5 rounded-xl hover:bg-surface-container border transition-all cursor-pointer group ${
            isProfileMenuOpen
              ? 'bg-surface-container border-primary/40'
              : 'border-transparent hover:border-outline-variant/60'
          }`}
          title="Open Profile Menu"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm leading-none">
              <span className="material-symbols-outlined text-[18px] leading-none">person</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-on-surface leading-tight truncate group-hover:text-primary transition-colors">
                {user?.username || 'Audiophile'}
              </span>
              <span className="font-mono text-[9px] text-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" /> Lossless Ready
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Profile Menu"
            className="w-7 h-7 rounded-lg text-on-surface-variant group-hover:text-primary flex items-center justify-center transition-colors leading-none"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">
              {isProfileMenuOpen ? 'expand_less' : 'settings'}
            </span>
          </button>
        </div>
      </div>

      <CreatePlaylistModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(pl) => {
          if (pl?.id) navigate(`/playlists/${pl.id}`)
        }}
      />
    </aside>
  )
}
