import React from 'react'
import { useRouterState } from '@tanstack/react-router'
import { ThemeToggle } from './ThemeToggle'
import { ConnectionStatus } from '../shared/ConnectionStatus'
import { CreateTaskButton } from '../create/CreateTaskButton'

const TITLES: Record<string, string> = {
  '/board': '🗂️ Kanban',
  '/list': '📋 Lista',
  '/agents': '🤖 Agentes',
  '/analytics': '📊 Analytics',
  '/calendar': '🗓️ Calendar',
  '/channels': '💬 Channels',
  '/orchestration': '🧩 Orchestration',
}

export function MobileHeader() {
  const { location } = useRouterState()
  const title = TITLES[location.pathname] ?? 'Laura'

  return (
    <header
      className="md:hidden sticky top-0 z-30
                 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md
                 border-b border-slate-200 dark:border-slate-700
                 pt-[env(safe-area-inset-top)]"
    >
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">🧠</span>
          <span className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <ConnectionStatus compact />
          <ThemeToggle />
          <CreateTaskButton mobile />
        </div>
      </div>
    </header>
  )
}
