import React from 'react'
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { useAuth } from '../auth'
import { LoginPage } from '../components/LoginPage'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { authenticated, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-neutral-500 text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return <LoginPage />
  }

  return (
    <div className="flex h-screen bg-neutral-900 text-white font-sans">
      <aside className="w-64 bg-neutral-950 p-4 border-r border-neutral-800 flex flex-col">
        <h1 className="text-xl font-bold mb-6 text-indigo-400">OpenClaw Admin</h1>
        <nav className="flex flex-col gap-1 flex-1">
          <Link to="/" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Dashboard</Link>
          <Link to="/config" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Config</Link>
          <Link to="/sessions" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Sessions</Link>
          <Link to="/agents" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Agents</Link>
          <Link to="/tools" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Tools</Link>
          <Link to="/providers" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Providers</Link>
          <Link to="/crons" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Crons</Link>
          <Link to="/channels" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Channels</Link>
          <div className="border-t border-neutral-800 my-2" />
          <Link to="/evolution" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">🧬 Evolution</Link>
          <div className="border-t border-neutral-800 my-2" />
          <Link to="/dashboard" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">📊 Task Dashboard</Link>
        </nav>

        {/* Logout button */}
        <button
          onClick={() => logout()}
          className="mt-auto px-3 py-2 rounded text-sm text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors text-left"
        >
          ⏻ Disconnect
        </button>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
