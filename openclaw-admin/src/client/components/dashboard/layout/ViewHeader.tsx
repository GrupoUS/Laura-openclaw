
import { ConnectionStatus } from '@/client/components/dashboard/shared/ConnectionStatus'
import { useTaskStore } from '@/client/hooks/useTaskStore'
import { CreateTaskButton } from '@/client/components/dashboard/create/CreateTaskButton'

export function ViewHeader({ title }: { title: string }) {
  const count = useTaskStore((s) => s.tasks.length)
  return (
    <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {count} tasks
        </span>
      </div>
      <div className="flex items-center gap-3">
        <ConnectionStatus />
        <CreateTaskButton />
      </div>
    </header>
  )
}
