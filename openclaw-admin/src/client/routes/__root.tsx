import React from 'react'
import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { Sidebar } from '../components/dashboard/layout/Sidebar'
import { useTaskEvents } from '../hooks/useTaskEvents'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { location } = useRouterState()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isLoginRoute = location.pathname === '/login'

  // Start SSE connection for real-time events
  useTaskEvents()

  // Login page — full screen, no sidebar
  if (isLoginRoute) {
    return <Outlet />
  }

  // Admin routes — simple layout (existing gateway admin)
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
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
