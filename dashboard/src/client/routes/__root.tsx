import React from 'react'
import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { ThemeProvider } from 'next-themes'
import { useAuth } from '../auth'
import { Sidebar } from '../components/dashboard/layout/Sidebar'
import { useTaskEvents } from '../hooks/useTaskEvents'
import type { UserPreferences } from '@/server/session'

export const Route = createRootRoute({
  component: AppRoot,
})

function AppRoot() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <RootLayout />
    </ThemeProvider>
  )
}

function LoginPage() {
  const { login } = useAuth()
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await login(password)
    if (!result.ok) {
      setError(result.error ?? 'Senha incorreta')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-4xl mb-2">🧠</p>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Laura Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sistema de Tarefas · Grupo US</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="dash-pwd" className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Senha de acesso
            </label>
            <input
              id="dash-pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              className="w-full border border-slate-200 dark:border-slate-700
                         bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
                         rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200
                          rounded-lg px-3 py-2 flex items-center gap-1.5">
              <span>⚠️</span> {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-slate-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium
                       hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⟳</span> Entrando...
              </span>
            ) : '→ Entrar'}
          </button>
        </form>
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
          Sistema interno · Grupo US
        </p>
      </div>
    </div>
  )
}

/** Authenticated layout — hooks called unconditionally */
function AuthenticatedLayout({ prefs }: { prefs: UserPreferences }) {
  const { location } = useRouterState()
  const isAdminRoute = location.pathname.startsWith('/admin')

  // SSE connection — always runs (hook must be unconditional)
  useTaskEvents()

  // Admin routes — minimal layout
  if (isAdminRoute) {
    return (
      <div className="flex h-screen bg-neutral-900 text-white font-sans">
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    )
  }

  // Dashboard — primary layout with sidebar
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        initialCollapsed={prefs.sidebarCollapsed}
        initialCompact={prefs.compactMode}
        initialDefaultView={prefs.defaultView}
      />
      <main 
        className="flex-1 flex flex-col overflow-hidden"
        data-compact={prefs.compactMode ? 'true' : 'false'}
      >
        <Outlet />
      </main>
    </div>
  )
}

function RootLayout() {
  const { authenticated, loading: authLoading } = useAuth()
  const [prefs, setPrefs] = React.useState<UserPreferences | null>(null)
  
  React.useEffect(() => {
    if (authenticated && !prefs) {
      fetch('/api/preferences').then(r => r.json()).then(d => setPrefs(d.data))
    }
  }, [authenticated, prefs])

  // Loading spinner
  if (authLoading || (authenticated && !prefs)) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 dark:text-slate-400 text-sm">Carregando...</span>
        </div>
      </div>
    )
  }

  // Not authenticated → show login
  if (!authenticated) {
    return <LoginPage />
  }

  // Authenticated → delegate to layout with SSE hook
  if (!prefs) return null
  return <AuthenticatedLayout prefs={prefs} />
}
