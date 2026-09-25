import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { showToast } from '../../store/useToastStore'
import { showConfirm, showPrompt } from '../../store/useConfirmStore'
import { nativeUserApi } from '../../api/nativeUserApi'
import subsonic from '../../api/subsonic'

export default function SettingsModal({ isOpen, onClose }) {
  const { user, logout } = useAuthStore()
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const data = await nativeUserApi.getUsers()
      setUsersList(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Failed to load users from native API:', err)
      // Fallback: show current user
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
    if (isOpen && activeTab === 'users' && user?.isAdmin) {
      loadUsers()
    }
  }, [isOpen, activeTab, user?.isAdmin])

  if (!isOpen) return null

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
    onClose()
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
      showToast('You cannot delete your own active account.', 'error', 'warning')
      return
    }
    const confirmed = await showConfirm({
      title: 'Delete User',
      message: `Are you sure you want to permanently delete user "${u.userName}"? This cannot be undone.`,
      confirmText: 'Delete User',
      danger: true,
    })
    if (!confirmed) {
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
    const newPass = await showPrompt({
      title: 'Change Password',
      message: `Enter new password for ${u.userName}:`,
      placeholder: 'New password',
      inputType: 'password',
      confirmText: 'Update Password',
    })
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-surface-container-high rounded-2xl p-6 shadow-2xl border border-outline-variant space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary leading-none">
              <span className="material-symbols-outlined text-[20px] leading-none">settings</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                Settings &amp; Profile
              </h3>
              <p className="font-mono text-[11px] text-on-surface-variant">
                Navidwirome Studio v2.4 • Audiophile Reference
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer leading-none"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">close</span>
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-outline-variant py-1.5 px-0.5 mb-2 overflow-x-auto">
          {[
            { id: 'profile', label: 'Profile & Library', icon: 'person' },
            ...(user?.isAdmin ? [{ id: 'users', label: 'User Management', icon: 'group' }] : []),
            { id: 'audio', label: 'Audio Engine', icon: 'graphic_eq' },
            { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: 'keyboard' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap leading-none ${
                activeTab === tab.id
                  ? 'bg-surface-container text-primary font-semibold border border-primary/20 shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Profile & Library */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* User Profile Card */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white text-base font-semibold shadow-md flex-shrink-0 leading-none select-none">
                  <span className="leading-none text-center -translate-y-[0.5px]">
                    {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
                  </span>
                </div>
                <div>
                  <h4 className="font-body-md text-sm font-semibold text-on-surface">
                    {user?.name || user?.username || 'User'}
                  </h4>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-primary/20 text-primary border border-primary/30 font-mono text-[10px] font-bold uppercase tracking-wider leading-none text-center">
                      {user?.isAdmin ? 'Administrator' : 'Standard User'}
                    </span>
                    <span className="text-[11px] text-on-surface-variant/80 font-mono">
                      @{user?.username}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border border-outline-variant text-on-surface-variant text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 leading-none"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">logout</span>
                <span>Log Out</span>
              </button>
            </div>

            {/* Library Maintenance & Rescan */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-body-md text-xs font-semibold text-on-surface">
                    Library Synchronization
                  </h5>
                  <p className="font-body-sm text-[11px] text-on-surface-variant">
                    Re-index new albums, FLAC tracks, and acoustic tags
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Rescan Library"
                  onClick={handleStartScan}
                  disabled={scanning}
                  className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm leading-none"
                >
                  <span
                    className={`material-symbols-outlined text-[16px] leading-none ${
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

        {/* Tab 2: User Management (Admin Only) */}
        {activeTab === 'users' && user?.isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-body-md text-xs font-semibold text-on-surface">
                  System User Accounts
                </h5>
                <p className="text-[11px] text-on-surface-variant">
                  Manage login credentials, upload, and tag editing privileges
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingUser(!isAddingUser)
                  setUserError(null)
                }}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-bright transition-all cursor-pointer flex items-center gap-1.5 shadow-sm leading-none"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">
                  {isAddingUser ? 'close' : 'person_add'}
                </span>
                <span>{isAddingUser ? 'Cancel' : 'Add User'}</span>
              </button>
            </div>

            {/* Add User Form */}
            {isAddingUser && (
              <form
                onSubmit={handleCreateUser}
                className="p-4 rounded-xl bg-surface-container-low border border-primary/30 space-y-3 animate-in fade-in"
              >
                <h6 className="font-mono text-[11px] font-bold text-primary uppercase tracking-wider">
                  Create New Account
                </h6>

                {userError && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {userError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-on-surface-variant mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={userForm.userName}
                      onChange={(e) => setUserForm({ ...userForm, userName: e.target.value })}
                      placeholder="e.g. soundengineer"
                      className="w-full h-8 px-2.5 rounded-lg bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-on-surface-variant mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      placeholder="e.g. Master Producer"
                      className="w-full h-8 px-2.5 rounded-lg bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-on-surface-variant mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      placeholder="user@example.com"
                      className="w-full h-8 px-2.5 rounded-lg bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-on-surface-variant mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="Min 6 characters"
                      className="w-full h-8 px-2.5 rounded-lg bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Checkbox Privileges */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface">
                    <input
                      type="checkbox"
                      checked={userForm.isAdmin}
                      onChange={(e) => setUserForm({ ...userForm, isAdmin: e.target.checked })}
                      className="rounded accent-primary"
                    />
                    <span>Administrator</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface">
                    <input
                      type="checkbox"
                      checked={userForm.canUpload}
                      onChange={(e) => setUserForm({ ...userForm, canUpload: e.target.checked })}
                      className="rounded accent-primary"
                    />
                    <span>Can Upload Audio</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface">
                    <input
                      type="checkbox"
                      checked={userForm.canEditTags}
                      onChange={(e) => setUserForm({ ...userForm, canEditTags: e.target.checked })}
                      className="rounded accent-primary"
                    />
                    <span>Can Edit Tags</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingUser(false)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container text-xs text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingUser}
                    className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-bright disabled:opacity-50 transition-all cursor-pointer shadow-md leading-none"
                  >
                    {submittingUser ? 'Saving...' : 'Save User'}
                  </button>
                </div>
              </form>
            )}

            {/* Users List Table */}
            <div className="rounded-xl border border-outline-variant overflow-hidden max-h-60 overflow-y-auto">
              {loadingUsers ? (
                <div className="py-8 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl animate-spin">
                    progress_activity
                  </span>
                </div>
              ) : usersList.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-on-surface-variant">
                  No users retrieved.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container font-mono text-[10px] text-on-surface-variant uppercase">
                      <th className="py-2 px-3">User</th>
                      <th className="py-2 px-3">Role &amp; Permissions</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {usersList.map((u) => {
                      const isMe = u.userName === user?.username
                      return (
                        <tr key={u.id || u.userName} className="hover:bg-surface-container/40">
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-on-surface leading-tight">
                              {u.name || u.userName}
                              {isMe && (
                                <span className="ml-1 text-[10px] font-mono text-primary font-normal">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="font-mono text-[10px] text-on-surface-variant">
                              @{u.userName}
                            </p>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase ${
                                  u.isAdmin
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'bg-surface-container text-on-surface-variant'
                                }`}
                              >
                                {u.isAdmin ? 'Admin' : 'Regular'}
                              </span>
                              {u.canUpload && (
                                <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono text-[9px]">
                                  Upload
                                </span>
                              )}
                              {u.canEditTags && (
                                <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono text-[9px]">
                                  Tags
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                title="Change Password"
                                onClick={() => handleChangePassword(u)}
                                className="w-7 h-7 rounded-md hover:bg-surface-container text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors cursor-pointer leading-none"
                              >
                                <span className="material-symbols-outlined text-[15px] leading-none">
                                  key
                                </span>
                              </button>
                              {!isMe && (
                                <button
                                  type="button"
                                  title="Delete User"
                                  onClick={() => handleDeleteUser(u)}
                                  className="w-7 h-7 rounded-md hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer leading-none"
                                >
                                  <span className="material-symbols-outlined text-[15px] leading-none">
                                    delete
                                  </span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Audio Engine Settings */}
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

        {/* Tab 4: Keyboard Shortcuts Guide */}
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
                <span className="text-on-surface-variant">Next Track</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-container-highest border border-outline-variant font-mono text-[11px] text-primary">
                  Alt + Right
                </kbd>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
