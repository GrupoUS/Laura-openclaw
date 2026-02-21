
import { Progress } from '@/client/components/dashboard/ui/progress'
import type { Subtask } from '@/shared/types/tasks'

export function SubtaskProgress({ subtasks }: { subtasks: Subtask[] }) {
  if (!subtasks.length) return null
  const done  = subtasks.filter((s) => s.status === 'done').length
  const total = subtasks.length
  const pct   = Math.round((done / total) * 100)

  return (
    <div className="flex items-center gap-2 mt-1">
      <Progress value={pct} className="h-1.5 flex-1" />
      <span className="text-xs text-slate-400 whitespace-nowrap">{done}/{total}</span>
    </div>
  )
}
