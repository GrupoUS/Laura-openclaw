import { Link, useRouterState } from '@tanstack/react-router'
import { useTaskStore } from '@/client/hooks/useTaskStore'
import { trpc } from '@/client/trpc'

const NAV = [
  { href: '/board',          label: '🗂️  Kanban'       },
  { href: '/list',           label: '📋  Lista'        },
  { href: '/calendar',       label: '📅  Calendário'   },
  { href: '/dash-agents',    label: '🤖  Agentes'      },
  { href: '/orchestration',  label: '🏗️  Orquestração' },
  { href: '/analytics',      label: '📊  Analytics'    },
]

const handleLogout = async () => {
  await fetch('/api/auth/logout', {
    method: 'POST', credentials: 'include'
  })
  window.location.href = '/login'
}

export function Sidebar() {
  const { location } = useRouterState()
  const path = location.pathname
  const isConnected = useTaskStore((s) => s.isConnected)
  const gatewayStatus = trpc.gateway.status.useQuery(undefined, { refetchInterval: 15_000 })
  const gwConnected = gatewayStatus.data?.connected ?? false

  return (
    <aside className="w-48 shrink-0 border-r border-slate-200 bg-slate-50 h-screen flex flex-col p-4 gap-1">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Laura Tasks
        </p>
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-400'}`}
              title={isConnected ? 'SSE conectado' : 'SSE desconectado'} />
      </div>
      <div className="flex items-center gap-1.5 px-3 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full ${gwConnected ? 'bg-emerald-500' : 'bg-red-400'}`} />
        <span className="text-[10px] text-slate-400" title={gatewayStatus.data?.url ?? ''}>
          Gateway {gwConnected ? 'online' : 'offline'}
        </span>
      </div>
      {NAV.map((n) => (
        <Link key={n.href} to={n.href}
          className={`text-sm px-3 py-2 rounded-md transition-colors ${
            path === n.href
              ? 'bg-slate-200 text-slate-900 font-medium'
              : 'text-slate-600 hover:bg-slate-100'
          }`}>
          {n.label}
        </Link>
      ))}
      <div className="mt-auto pt-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full text-xs text-slate-400 hover:text-red-500
                     px-3 py-2 rounded-md hover:bg-red-50 transition-colors text-left"
        >
          ⎋ Sair
        </button>
      </div>
    </aside>
  )
}
