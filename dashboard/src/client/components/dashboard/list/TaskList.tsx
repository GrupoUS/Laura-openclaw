
import { useEffect, useMemo } from 'react'
import { PhaseGroup } from './PhaseGroup'
import { useTaskStore } from '@/client/hooks/useTaskStore'
import { ViewHeader } from '@/client/components/dashboard/layout/ViewHeader'
import { KpiStrip } from '@/client/components/dashboard/shared/KpiStrip'
import type { Task } from '@/shared/types/tasks'
import type { ViewMode } from '@/client/components/dashboard/layout/ViewHeader'

interface TaskListProps {
  initialTasks: Task[]
  viewToggle?: {
    view: ViewMode
    onToggle: (view: ViewMode) => void
  }
}

export function TaskList({ initialTasks, viewToggle }: TaskListProps) {
  const setTasks = useTaskStore((s) => s.setTasks)
  useEffect(() => { setTasks(initialTasks) }, [initialTasks, setTasks])

  const tasks = useTaskStore((s) => s.tasks)
  const groups = useMemo(() => {
    const g: Record<number, Task[]> = {}
    for (const t of tasks) {
      if (!g[t.phase]) g[t.phase] = []
      g[t.phase].push(t)
    }
    return g
  }, [tasks])
  const phases = Object.keys(groups).map(Number).toSorted((a, b) => a - b)

  return (
    <>
      <ViewHeader title="Tasks" viewToggle={viewToggle} />
      <KpiStrip tasks={tasks} />
      <div className="flex-1 overflow-y-auto p-6
                      bg-gradient-to-br from-slate-50 via-white to-slate-100/50
                      dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50">
        {phases.length === 0 && (
          <div className="text-center text-slate-400 py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">Nenhuma tarefa criada ainda.</p>
            <p className="text-xs mt-1">Solicite algo à Laura para ver as tasks aqui.</p>
          </div>
        )}
        {phases.map((phase) => (
          <PhaseGroup key={phase} phase={phase} tasks={groups[phase]} />
        ))}
      </div>
    </>
  )
}
