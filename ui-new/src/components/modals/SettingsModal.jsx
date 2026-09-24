import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import subsonic from '../../api/subsonic'

export default function SettingsModal({ isOpen, onClose }) {
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'audio' | 'shortcuts'
  const [scanStatus, setScanStatus] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [audioFormat, setAudioFormat] = useState('original')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleStartScan = async () => {
    setScanning(true)
    try {
      const res = await subsonic.startScan()
      setScanStatus(res)
      setTimeout(async () => {
        const status = await subsonic.getScanStatus()
        setScanStatus(status)
        setScanning(false)
      }, 1500)
    } catch (err) {
      console.error('Failed to trigger scan:', err)
      setScanning(false)
    }
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-surface-container-high rounded-2xl p-6 shadow-2xl border border-outline-variant space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">tune</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                Settings &amp; Profile
              </h3>
              <p className="font-mono text-[11px] text-on-surface-variant">
                Navidwirome Studio v2.4 • Audiophile Engine
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-outline-variant pb-2">
          {[
            { id: 'profile', label: 'Profile & Library', icon: 'account_circle' },
            { id: 'audio', label: 'Audio Engine', icon: 'graphic_eq' },
            { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: 'keyboard' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-surface-container text-primary font-semibold border border-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Profile & Library Management */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* User Profile Card */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>
                <div>
                  <h4 className="font-body-md text-sm font-semibold text-on-surface">
                    {user?.username || 'User'}
                  </h4>
                  <p className="font-mono text-xs text-primary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Administrator (Full Audio Mutation Access)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Log Out</span>
              </button>
            </div>

            {/* Library Maintenance & Rescan */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-body-md text-xs font-semibold text-on-surface">
                    Audio Library Synchronization
                  </h5>
                  <p className="font-body-sm text-[11px] text-on-surface-variant">
                    Re-index new albums, flac tracks, and update acoustic metadata
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Rescan Library"
                  onClick={handleStartScan}
                  disabled={scanning}
                  className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      scanning ? 'animate-spin' : ''
                    }`}
                  >
                    sync
                  </span>
                  <span>{scanning ? 'Scanning...' : 'Rescan Library'}</span>
                </button>
              </div>

              {scanStatus && (
                <div className="p-2.5 rounded-lg bg-surface-container text-xs font-mono text-on-surface-variant flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>
                    {scanStatus.scanning
                      ? `Scanning in progress... (${scanStatus.count || 0} files found)`
                      : 'Audio library index is up to date.'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Audio Engine Settings */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant space-y-3">
              <h5 className="font-body-md text-xs font-semibold text-on-surface">
                Streaming Output Format
              </h5>
              <p className="text-[11px] text-on-surface-variant">
                Select your preferred DAC streaming buffer pipeline
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { id: 'original', label: 'Lossless Direct', desc: 'Bit-perfect FLAC / ALAC' },
                  { id: 'mp3_320', label: '320k High-Res', desc: 'Standard studio MP3' },
                  { id: 'opus_192', label: '192k Opus', desc: 'Low-bandwidth stream' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setAudioFormat(fmt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      audioFormat === fmt.id
                        ? 'bg-surface-container border-primary text-primary font-semibold'
                        : 'bg-surface-container-high border-outline-variant text-on-surface hover:border-primary/40'
                    }`}
                  >
                    <p className="text-xs font-medium">{fmt.label}</p>
                    <p className="text-[10px] text-on-surface-variant/80 font-mono mt-0.5">
                      {fmt.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-body-md text-xs font-semibold text-on-surface">
                    ReplayGain Acoustic Normalization
                  </h5>
                  <p className="text-[11px] text-on-surface-variant">
                    Equalize track peak loudness across varied album masterings
                  </p>
                </div>
                <div className="w-10 h-5 bg-primary/20 border border-primary/40 rounded-full flex items-center p-0.5 cursor-pointer">
                  <div className="w-4 h-4 rounded-full bg-primary translate-x-5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Keyboard Shortcuts Guide */}
        {activeTab === 'shortcuts' && (
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant space-y-2.5">
            <h5 className="font-body-md text-xs font-semibold text-on-surface pb-1 border-b border-outline-variant">
              System Playback &amp; Navigation Hotkeys
            </h5>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container">
                <span className="text-on-surface-variant">Play / Pause</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-container-highest border border-outline-variant font-mono text-[11px] text-primary">
                  Space
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container">
                <span className="text-on-surface-variant">Catalog Search</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-container-highest border border-outline-variant font-mono text-[11px] text-primary">
                  Cmd / Ctrl + K
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container">
                <span className="text-on-surface-variant">Close Active Dialog</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-container-highest border border-outline-variant font-mono text-[11px] text-primary">
                  Escape
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container">
                <span className="text-on-surface-variant">Next / Previous</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-container-highest border border-outline-variant font-mono text-[11px] text-primary">
                  Player Bar
                </kbd>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
