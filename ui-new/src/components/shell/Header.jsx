import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store/useUIStore'

export default function Header() {
  const { activeTab, setActiveTab, isRightPanelOpen } = useUIStore()
  const navigate = useNavigate()

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'queue', label: 'Up Next' },
    { id: 'history', label: 'History' },
  ]

  return (
    <header
      className={`fixed top-0 left-[240px] h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant z-20 flex items-center justify-between px-6 select-none transition-all ${
        isRightPanelOpen ? 'right-[320px]' : 'right-0'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
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
        <div className="h-4 w-px bg-outline-variant mx-1" />
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'overview') navigate('/')
              }}
              className={`px-3 py-1 rounded-lg text-xs transition-colors font-medium cursor-pointer ${
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

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container border border-outline-variant">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="font-mono text-[10px] text-on-surface font-medium uppercase tracking-wider">
            Direct Stream
          </span>
        </div>
      </div>
    </header>
  )
}
