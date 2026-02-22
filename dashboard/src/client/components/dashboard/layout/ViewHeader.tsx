import { ConnectionStatus } from '@/client/components/dashboard/shared/ConnectionStatus'
import { useTaskStore } from '@/client/hooks/useTaskStore'
import { CreateTaskButton } from '@/client/components/dashboard/create/CreateTaskButton'
import { ThemeToggle } from './ThemeToggle'

export function ViewHeader({ title }: { title: string }) {
  const count = useTaskStore((s) => s.tasks.length)
  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-700
                        bg-white dark:bg-slate-900
                        flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        {count > 0 && (
          <span className="text-xs text-slate-400 dark:text-slate-500
                            bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {count} tasks
          </span>
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
