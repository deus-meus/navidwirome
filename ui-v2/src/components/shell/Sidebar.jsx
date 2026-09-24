import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import subsonic from '../../api/subsonic'
import { useAuthStore } from '../../store/useAuthStore'

export default function Sidebar() {
  const [playlists, setPlaylists] = useState([])
  const { user } = useAuthStore()

  useEffect(() => {
    subsonic.getPlaylists().then(setPlaylists).catch(() => setPlaylists([]))
  }, [])

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
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search catalog (Cmd+K)"
            className="w-full h-9 pl-8 pr-2 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant text-xs focus:outline-none focus:border-primary transition-colors font-sans"
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
            <button className="text-on-surface-variant hover:text-primary transition-colors">
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

      {/* User Status Bar */}
      <div className="p-3 border-t border-outline-variant bg-surface-container-lowest/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs">
              <span className="material-symbols-outlined text-[16px]">person</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-on-surface leading-tight">
                {user?.username || 'Audiophile'}
              </span>
              <span className="font-mono text-[9px] text-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span> Lossless Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
