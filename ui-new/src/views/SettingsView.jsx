import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { showToast } from '../store/useToastStore'
import { nativeUserApi } from '../api/nativeUserApi'
import subsonic from '../api/subsonic'

export default function SettingsView() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'users' | 'audio' | 'shortcuts'
  const [scanStatus, setScanStatus] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [audioFormat, setAudioFormat] = useState('original')

  // User Management State
  const [usersList, setUsersList] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [userForm, setUserForm] = useState({
    userName: '',
    name: '',
    email: '',
    password: '',
    isAdmin: false,
    canUpload: true,
    canEditTags: true,
  })
  const [submittingUser, setSubmittingUser] = useState(false)
  const [userError, setUserError] = useState(null)

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const data = await nativeUserApi.getUsers()
      setUsersList(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Failed to load users from native API:', err)
      if (user) {
        setUsersList([
          {
            id: user.id || 'current',
            userName: user.username,
            name: user.name || user.username,
            isAdmin: user.isAdmin,
            canUpload: user.canUpload,
            canEditTags: user.canEditTags,
          },
        ])
      }
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'users' && user?.isAdmin) {
      loadUsers()
    }
  }, [activeTab, user?.isAdmin])

  const handleStartScan = async () => {
    setScanning(true)
    try {
      const res = await subsonic.startScan()
      setScanStatus(res)
      showToast('Library scan initiated', 'info', 'sync')
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
    navigate('/')
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!userForm.userName.trim() || !userForm.password.trim()) {
      setUserError('Username and password are required.')
      return
    }

    setSubmittingUser(true)
    setUserError(null)
    try {
      await nativeUserApi.createUser({
        userName: userForm.userName.trim(),
        name: userForm.name.trim() || userForm.userName.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        isAdmin: userForm.isAdmin,
        canUpload: userForm.canUpload,
        canEditTags: userForm.canEditTags,
      })
      showToast(`User "${userForm.userName.trim()}" created successfully`, 'success', 'person_add')
      setIsAddingUser(false)
      setUserForm({
        userName: '',
        name: '',
        email: '',
        password: '',
        isAdmin: false,
        canUpload: true,
        canEditTags: true,
      })
      loadUsers()
    } catch (err) {
      setUserError(err.message || 'Failed to create user')
    } finally {
      setSubmittingUser(false)
    }
  }

  const handleDeleteUser = async (u) => {
    if (u.userName === user?.username) {
      alert('You cannot delete your own active account.')
      return
    }
    if (!window.confirm(`Are you sure you want to permanently delete user "${u.userName}"?`)) {
      return
    }
    try {
      await nativeUserApi.deleteUser(u.id)
      showToast(`User "${u.userName}" deleted`, 'success', 'delete')
      loadUsers()
    } catch (err) {
      showToast(`Failed to delete user: ${err.message}`, 'error', 'error')
    }
  }

  const handleChangePassword = async (u) => {
    const newPass = window.prompt(`Enter new password for ${u.userName}:`)
    if (newPass && newPass.trim()) {
      try {
        await nativeUserApi.updateUser(u.id, { password: newPass.trim() })
        showToast(`Password updated for "${u.userName}"`, 'success', 'check_circle')
      } catch (err) {
        showToast(`Failed to update password: ${err.message}`, 'error', 'error')
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Header */}
      <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back to previous view"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer leading-none"
          >
            <span className="material-symbols-outlined text-[20px] leading-none">arrow_back</span>
          </button>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-on-surface">
              Settings &amp; System
            </h1>
            <p className="font-mono text-xs text-on-surface-variant">
              Navidwirome Studio v2.4 • Audiophile Reference Management
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="px-4 h-9 rounded-xl bg-surface-container-low hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border border-outline-variant text-on-surface-variant text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 leading-none"
        >
          <span className="material-symbols-outlined text-[16px] leading-none">logout</span>
          <span>Log Out</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant pb-3 overflow-x-auto">
        {[
          { id: 'profile', label: 'Profile & Library', icon: 'person' },
          ...(user?.isAdmin ? [{ id: 'users', label: 'User Management', icon: 'group' }] : []),
          { id: 'audio', label: 'Audio Engine', icon: 'graphic_eq' },
          { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: 'keyboard' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-label={tab.label}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 h-9 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap leading-none ${
              activeTab === tab.id
                ? 'bg-surface-container text-primary font-semibold border border-primary/20 shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[17px] leading-none">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Profile & Library */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Profile Card */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0 select-none overflow-hidden">
                <span className="leading-none flex items-center justify-center text-center">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-semibold text-on-surface leading-tight">
                  {user?.name || user?.username || 'User'}
                </h3>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-primary/20 text-primary border border-primary/30 font-mono text-[10px] font-bold uppercase tracking-wider leading-none text-center">
                    {user?.isAdmin ? 'Administrator' : 'Standard User'}
                  </span>
                  <span className="text-xs text-on-surface-variant font-mono">
                    @{user?.username}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/60 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-outline-variant/30">
                <span className="text-on-surface-variant font-mono">Audio Permissions:</span>
                <span className="font-semibold text-primary">
                  {user?.canUpload ? 'Upload Ready' : 'Stream Only'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/30">
                <span className="text-on-surface-variant font-mono">Tag Editing:</span>
                <span className="font-semibold text-primary">
                  {user?.canEditTags ? 'Full Access' : 'Read Only'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-on-surface-variant font-mono">Stream Pipeline:</span>
                <span className="font-semibold text-on-surface">24-bit / 96kHz Direct DAC</span>
              </div>
            </div>
          </div>

          {/* Library Indexer & Synchronizer */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-semibold text-on-surface">
                  Library Indexer
                </h3>
                <span className="inline-flex items-center justify-center font-mono text-[10px] px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/20 leading-none text-center">
                  Subsonic Native
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Trigger high-performance audio fingerprinting and rescan local storage for new FLAC,
                MP3, or ALAC audio files and tag alterations.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {scanStatus && (
                <div className="p-3 rounded-xl bg-surface-container text-xs font-mono text-on-surface-variant flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>
                    Indexed: {scanStatus.count || 0} tracks ({scanStatus.scanning ? 'Active...' : 'Complete'})
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleStartScan}
                disabled={scanning}
                className="w-full h-10 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm leading-none"
              >
                <span
                  className={`material-symbols-outlined text-[18px] leading-none ${
                    scanning ? 'animate-spin' : ''
                  }`}
                >
                  sync
                </span>
                <span>{scanning ? 'Scanning Filesystem...' : 'Start Library Scan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Management (Admin Only) */}
      {activeTab === 'users' && user?.isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-semibold text-on-surface">
                User Management
              </h3>
              <p className="font-mono text-xs text-on-surface-variant">
                Manage accounts, grant permissions, and configure security
              </p>
            </div>
            <button
              type="button"
              aria-label="+ Add User"
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="px-4 h-9 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-bright transition-all cursor-pointer flex items-center gap-1.5 shadow-sm leading-none"
            >
              <span className="material-symbols-outlined text-[17px] leading-none">
                {isAddingUser ? 'close' : 'person_add'}
              </span>
              <span>{isAddingUser ? 'Cancel' : '+ Add User'}</span>
            </button>
          </div>

          {/* Add User Form Drawer */}
          {isAddingUser && (
            <form
              onSubmit={handleCreateUser}
              className="p-5 rounded-2xl bg-surface-container-low border border-primary/30 space-y-4 animate-in fade-in"
            >
              <h4 className="text-sm font-semibold text-primary">Create New User Account</h4>
              {userError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {userError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant font-mono">Username *</label>
                  <input
                    type="text"
                    required
                    value={userForm.userName}
                    onChange={(e) => setUserForm({ ...userForm, userName: e.target.value })}
                    placeholder="e.g. soundmaster"
                    className="w-full h-9 px-3 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant font-mono">Display Name</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="e.g. Sound Master"
                    className="w-full h-9 px-3 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant font-mono">Email Address</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full h-9 px-3 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant font-mono">Password *</label>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-9 px-3 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-on-surface">
                  <input
                    type="checkbox"
                    checked={userForm.isAdmin}
                    onChange={(e) => setUserForm({ ...userForm, isAdmin: e.target.checked })}
                    className="rounded-md accent-primary"
                  />
                  <span>Administrator Access</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-on-surface">
                  <input
                    type="checkbox"
                    checked={userForm.canUpload}
                    onChange={(e) => setUserForm({ ...userForm, canUpload: e.target.checked })}
                    className="rounded-md accent-primary"
                  />
                  <span>Allow Audio Uploads</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-on-surface">
                  <input
                    type="checkbox"
                    checked={userForm.canEditTags}
                    onChange={(e) => setUserForm({ ...userForm, canEditTags: e.target.checked })}
                    className="rounded-md accent-primary"
                  />
                  <span>Allow Metadata Editing</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-4 h-9 rounded-xl bg-surface-container text-xs text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-5 h-9 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all cursor-pointer shadow-md leading-none"
                >
                  {submittingUser ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          {/* User Table */}
          <div className="rounded-2xl border border-outline-variant overflow-hidden bg-surface-container-low">
            {loadingUsers ? (
              <div className="py-12 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl animate-spin">
                  progress_activity
                </span>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container border-b border-outline-variant font-mono text-[11px] text-on-surface-variant uppercase">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Permissions</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60 font-sans">
                  {usersList.map((u) => (
                    <tr key={u.id || u.userName} className="hover:bg-surface-container/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-on-surface">
                          {u.name || u.userName}
                        </div>
                        <div className="font-mono text-[11px] text-on-surface-variant">
                          @{u.userName}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg font-mono text-[9px] font-bold uppercase leading-none text-center ${
                            u.isAdmin
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {u.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {u.canUpload && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-surface-container text-on-surface-variant font-mono text-[9px] leading-none text-center">
                              Upload
                            </span>
                          )}
                          {u.canEditTags && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-surface-container text-on-surface-variant font-mono text-[9px] leading-none text-center">
                              Tags
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Change password"
                            aria-label="Change password"
                            onClick={() => handleChangePassword(u)}
                            className="w-8 h-8 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors cursor-pointer leading-none"
                          >
                            <span className="material-symbols-outlined text-[17px] leading-none">
                              key
                            </span>
                          </button>
                          {u.userName !== user?.username && (
                            <button
                              type="button"
                              title="Delete user"
                              aria-label="Delete user"
                              onClick={() => handleDeleteUser(u)}
                              className="w-8 h-8 rounded-xl hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer leading-none"
                            >
                              <span className="material-symbols-outlined text-[17px] leading-none">
                                delete
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Audio Engine */}
      {activeTab === 'audio' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant space-y-4">
            <h3 className="font-serif text-base font-semibold text-on-surface">
              Streaming Quality &amp; Transcoding
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'original', title: 'Bit-Perfect Direct', desc: 'Lossless FLAC / DSD • No Transcoding' },
                { id: '320', title: 'Studio Master 320k', desc: 'Opus / AAC High Bitrate' },
                { id: '192', title: 'Mobile Bandwidth', desc: '192 kbps MP3 Saver' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setAudioFormat(fmt.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    audioFormat === fmt.id
                      ? 'border-primary bg-primary/10 text-on-surface'
                      : 'border-outline-variant bg-surface-container hover:border-outline text-on-surface-variant'
                  }`}
                >
                  <div className="font-semibold text-xs text-on-surface">{fmt.title}</div>
                  <div className="font-mono text-[10px] text-on-surface-variant/80 pt-0.5">
                    {fmt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant space-y-3">
            <h3 className="font-serif text-base font-semibold text-on-surface">
              Audiophile Buffer &amp; ReplayGain
            </h3>
            <div className="flex items-center justify-between text-xs py-1">
              <div>
                <div className="font-semibold text-on-surface">Album ReplayGain</div>
                <div className="text-on-surface-variant font-mono text-[11px]">
                  Normalize dynamic loudness across album collections
                </div>
              </div>
              <div className="w-10 h-5 bg-primary/20 border border-primary/40 rounded-full flex items-center p-0.5 cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-primary translate-x-5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Keyboard Shortcuts */}
      {activeTab === 'shortcuts' && (
        <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant space-y-3">
          <h3 className="font-serif text-base font-semibold text-on-surface pb-1">
            Studio Keybindings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container">
              <span className="text-xs text-on-surface">Play / Pause Stream</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-surface-container-highest border border-outline-variant font-mono text-xs text-primary font-semibold">
                Space
              </kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container">
              <span className="text-xs text-on-surface">Global Catalog Search</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-surface-container-highest border border-outline-variant font-mono text-xs text-primary font-semibold">
                Cmd / Ctrl + K
              </kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container">
              <span className="text-xs text-on-surface">Close Modal or Context Menu</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-surface-container-highest border border-outline-variant font-mono text-xs text-primary font-semibold">
                Esc
              </kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container">
              <span className="text-xs text-on-surface">Next / Previous Track</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-surface-container-highest border border-outline-variant font-mono text-xs text-primary font-semibold">
                Media Keys
              </kbd>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
