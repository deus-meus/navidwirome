import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import LoginView from './components/auth/LoginView'
import ShellLayout from './components/shell/ShellLayout'
import DiscoverView from './views/DiscoverView'

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-primary">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginView />
  }

  return (
    <BrowserRouter>
      <ShellLayout>
        <Routes>
          <Route path="/" element={<DiscoverView />} />
          <Route
            path="*"
            element={
              <div className="p-8 text-center text-on-surface-variant text-sm font-mono">
                View coming in next phase.
              </div>
            }
          />
        </Routes>
      </ShellLayout>
    </BrowserRouter>
  )
}
