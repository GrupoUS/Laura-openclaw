import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Sidebar } from '@/client/components/dashboard/layout/Sidebar'
import { useTaskEvents } from '@/client/hooks/useTaskEvents'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  // Start SSE connection for all dashboard pages
  useTaskEvents()

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
