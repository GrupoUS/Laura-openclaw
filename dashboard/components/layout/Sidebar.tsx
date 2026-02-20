'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/board', label: '🗂️  Kanban' },
  { href: '/list',  label: '📋  Lista' },
]

export function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-48 shrink-0 border-r border-slate-200 bg-slate-50 h-screen flex flex-col p-4 gap-1">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Laura Tasks
      </p>
      {NAV.map((n) => (
        <Link key={n.href} href={n.href}
          className={`text-sm px-3 py-2 rounded-md transition-colors ${
            path === n.href
              ? 'bg-slate-200 text-slate-900 font-medium'
              : 'text-slate-600 hover:bg-slate-100'
          }`}>
          {n.label}
        </Link>
      ))}
    </aside>
  )
}
