import { useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'

export default function LoginView() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) return
    await login(username, password)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-outline-variant bg-surface-container-low p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/30 bg-surface-container text-primary">
            <span className="material-symbols-outlined text-2xl">graphic_eq</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-on-surface">Navidwirome</h1>
          <span className="font-mono text-xs uppercase tracking-wider text-primary">Studio Edition</span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-center text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1 font-mono uppercase">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full h-10 rounded-lg border border-outline-variant bg-surface-container px-3 text-sm text-on-surface placeholder:text-on-surface-dim focus:border-primary focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1 font-mono uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 rounded-lg border border-outline-variant bg-surface-container px-3 text-sm text-on-surface placeholder:text-on-surface-dim focus:border-primary focus:outline-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 h-10 rounded-lg bg-primary font-medium text-sm text-white hover:bg-primary-bright transition-colors shadow-md disabled:opacity-50"
          >
            {isLoading ? 'Connecting...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
