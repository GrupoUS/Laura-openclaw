import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <div className="flex h-screen bg-neutral-900 text-white font-sans">
      <aside className="w-64 bg-neutral-950 p-4 border-r border-neutral-800 flex flex-col gap-2">
        <h1 className="text-xl font-bold mb-6 text-indigo-400">OpenClaw Admin</h1>
        <nav className="flex flex-col gap-1">
          <Link to="/" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Dashboard</Link>
          <Link to="/config" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Config</Link>
          <Link to="/sessions" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Sessions</Link>
          <Link to="/agents" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Agents</Link>
          <Link to="/tools" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Tools</Link>
          <Link to="/providers" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Providers</Link>
          <Link to="/crons" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Crons</Link>
          <Link to="/channels" className="px-3 py-2 rounded hover:bg-neutral-800 [&.active]:bg-indigo-900/50 [&.active]:text-indigo-400">Channels</Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  ),
})
