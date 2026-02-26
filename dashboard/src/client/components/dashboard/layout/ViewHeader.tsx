import { ConnectionStatus } from '@/client/components/dashboard/shared/ConnectionStatus'
import { useTaskStore } from '@/client/hooks/useTaskStore'
import { CreateTaskButton } from '@/client/components/dashboard/create/CreateTaskButton'
import { ThemeToggle } from './ThemeToggle'
import { Badge } from '@/client/components/dashboard/ui/badge'

export type ViewMode = 'kanban' | 'list'

interface ViewHeaderProps {
  title: string
  viewToggle?: {
    view: ViewMode
    onToggle: (view: ViewMode) => void
  }
}

export function ViewHeader({ title, viewToggle }: ViewHeaderProps) {
  const count = useTaskStore((s) => s.tasks.length)
  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-700
                        bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm
                        flex items-center justify-between px-5 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h1>
        {count > 0 && (
          <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 font-mono tabular-nums">
            {count}
          </Badge>
        )}
        {viewToggle && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 ml-1">
            <button
              onClick={() => viewToggle.onToggle('kanban')}
              className={`group flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md
                         transition-all duration-200 ${
                viewToggle.view === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   className="transition-transform duration-200 group-hover:scale-110">
                <rect x="3" y="3" width="7" height="18" rx="1"/>
                <rect x="14" y="3" width="7" height="9" rx="1"/>
              </svg>
              Kanban
            </button>
            <button
              onClick={() => viewToggle.onToggle('list')}
              className={`group flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md
                         transition-all duration-200 ${
                viewToggle.view === 'list'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   className="transition-transform duration-200 group-hover:scale-110">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              Lista
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <ConnectionStatus />
        <CreateTaskButton />
      </div>
    </header>
  )
}
