'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/board',  label: '🗂️  Kanban'  },
  { href: '/list',   label: '📋  Lista'   },
  { href: '/agents', label: '🤖  Agentes' },
  { href: '/analytics', label: '📊  Analytics'  },
]

export function Sidebar() {
  const path = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST', credentials: 'include'
    })
    router.push('/login')
    router.refresh()
  }

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
