import { Link, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { useTaskStore } from '@/client/hooks/useTaskStore'
import { trpc } from '@/client/trpc'
import { usePreferences } from '@/client/hooks/usePreferences'
import { PreferencesSheet } from './PreferencesSheet'
import type { UserPreferences } from '@/server/session'

const NAV = [
  { href: '/board',          label: 'Kanban',       icon: '🗂️' },
  { href: '/list',           label: 'Lista',        icon: '📋' },
  { href: '/office',         label: 'Office',       icon: '🏢' },
  { href: '/content',        label: 'Content',      icon: '🎬' },
  { href: '/dash-agents',    label: 'Agentes',      icon: '🤖' },
  { href: '/orchestration',  label: 'Orquestração', icon: '🏗️' },
  { href: '/analytics',      label: 'Analytics',    icon: '📊' },
]

interface Props {
  initialCollapsed:   boolean
  initialCompact:     boolean
  initialDefaultView: UserPreferences['defaultView']
}

const handleLogout = async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  window.location.href = '/login'
}

export function Sidebar({ initialCollapsed, initialCompact, initialDefaultView }: Props) {
  const { location } = useRouterState()
  const path = location.pathname
  const { prefs, updatePref } = usePreferences({
    sidebarCollapsed: initialCollapsed,
    compactMode:      initialCompact,
    defaultView:      initialDefaultView,
  })
  const [prefsOpen, setPrefsOpen] = useState(false)
  const collapsed = prefs.sidebarCollapsed

  const toggleCollapse = () => updatePref('sidebarCollapsed', !collapsed)

  const isConnected = useTaskStore((s) => s.isConnected)
  const gatewayStatus = trpc.gateway.status.useQuery(undefined, { refetchInterval: 15_000 })
  const gwConnected = gatewayStatus.data?.connected ?? false

  return (
    <>
      <aside
        className={`shrink-0 border-r border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-900 h-screen flex flex-col
                    transition-all duration-200 ease-in-out
                    ${collapsed ? 'w-14' : 'w-48'}`}
      >
        <div className={`flex items-center border-b border-slate-200 dark:border-slate-700
                         h-14 px-3 gap-2 shrink-0`}>
          <span className="text-xl">🧠</span>
          {!collapsed && (
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              Laura Tasks
            </span>
          )}
        </div>

        {!collapsed && (
          <div className="flex items-center gap-2 px-3 mt-3 mb-1">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-400'}`}
                  title={isConnected ? 'SSE conectado' : 'SSE desconectado'} />
            <span className={`w-1.5 h-1.5 rounded-full ${gwConnected ? 'bg-emerald-500' : 'bg-red-400'}`} />
            <span className="text-[10px] text-slate-400 truncate" title={gatewayStatus.data?.url ?? ''}>
              Gateway {gwConnected ? 'online' : 'offline'}
            </span>
          </div>
        )}

        <nav className="flex flex-col gap-1 p-2 flex-1 mt-2">
          {collapsed && (
            <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-600
                           uppercase tracking-wider text-center mb-1">
              Nav
            </p>
          )}
          {!collapsed && (
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-600
                           uppercase tracking-wider px-2 mb-1">
              Navegação
            </p>
          )}
          {NAV.map((n) => {
            const active = path === n.href
            return (
              <Link
                key={n.href}
                to={n.href}
                className={`flex items-center gap-2.5 rounded-md transition-colors
                            ${collapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2'}
                            ${active
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title={collapsed ? n.label : undefined}
              >
                <span className="text-base shrink-0">{n.icon}</span>
                {!collapsed && <span className="text-sm truncate">{n.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-1">
          <button
            onClick={() => setPrefsOpen(true)}
            className={`flex items-center gap-2.5 rounded-md text-slate-500 dark:text-slate-400
                        hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                        ${collapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2'}`}
            title={collapsed ? 'Preferências' : undefined}
          >
            <span className="text-base shrink-0">⚙️</span>
            {!collapsed && <span className="text-xs">Preferências</span>}
          </button>

          <button
            onClick={toggleCollapse}
            className={`flex items-center gap-2.5 rounded-md text-slate-400 dark:text-slate-600
                        hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                        ${collapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2'}`}
            title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            <span className="text-base shrink-0">{collapsed ? '→' : '←'}</span>
            {!collapsed && <span className="text-xs">Colapsar</span>}
          </button>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-2.5 rounded-md text-slate-400 dark:text-slate-600
                        hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500
                        transition-colors
                        ${collapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2'}`}
            title={collapsed ? 'Sair' : undefined}
          >
            <span className="text-base shrink-0">⎋</span>
            {!collapsed && <span className="text-xs">Sair</span>}
          </button>
        </div>
      </aside>

      <PreferencesSheet
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        prefs={prefs}
        updatePref={updatePref}
      />
    </>
  )
}
