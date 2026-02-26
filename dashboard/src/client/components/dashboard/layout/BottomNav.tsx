import React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'

const NAV = [
  { to: '/board', icon: '🗂️', label: 'Kanban' },
  { to: '/agents', icon: '🤖', label: 'Agentes' },
  { to: '/office', icon: '🏢', label: 'Office' },
] as const

export function BottomNav() {
  const { location } = useRouterState()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden
                 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md
                 border-t border-slate-200 dark:border-slate-700
                 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="h-14 flex items-stretch">
        {NAV.map((n) => {
          const active = location.pathname === n.to || location.pathname.startsWith(n.to + '/')
          return (
            <Link
              key={n.to}
              to={n.to}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-0.5 select-none',
                active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400',
              ].join(' ')}
            >
              <span className={['text-xl transition-transform', active ? 'scale-110' : 'scale-100'].join(' ')}>
                {n.icon}
              </span>
              <span className={['text-[10px] font-medium', active ? 'opacity-100' : 'opacity-60'].join(' ')}>
                {n.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
