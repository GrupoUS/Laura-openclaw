
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { TaskDetailModal } from './TaskDetailModal'
import { useTaskStore } from '@/client/hooks/useTaskStore'
import { patchTaskStatus } from '@/client/lib/api'
import { ViewHeader } from '@/client/components/dashboard/layout/ViewHeader'
import { KpiStrip } from '@/client/components/dashboard/shared/KpiStrip'
import type { Task, TaskStatus } from '@/shared/types/tasks'
import type { ViewMode } from '@/client/components/dashboard/layout/ViewHeader'

const COLUMNS: TaskStatus[] = ['backlog', 'in_progress', 'done', 'blocked']

interface KanbanBoardProps {
  initialTasks: Task[]
  viewToggle?: {
    view: ViewMode
    onToggle: (view: ViewMode) => void
  }
}

export function KanbanBoard({ initialTasks, viewToggle }: KanbanBoardProps) {
  const setTasks             = useTaskStore((s) => s.setTasks)
  const moveTaskOptimistic   = useTaskStore((s) => s.moveTaskOptimistic)
  const rollbackTaskStatus   = useTaskStore((s) => s.rollbackTaskStatus)

  useEffect(() => { setTasks(initialTasks) }, [initialTasks, setTasks])

  const tasks = useTaskStore((s) => s.tasks)
  const groups = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = { backlog: [], in_progress: [], done: [], blocked: [] }
    for (const t of tasks) {
      const col = g[t.status] ? t.status : 'backlog'
      g[col].push(t)
    }
    return g
  }, [tasks])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTaskId(task.id)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    const task = useTaskStore.getState().tasks.find((t) => t.id === active.id)
    setActiveTask(task ?? null)
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveTask(null)
    if (!over || active.id === over.id) return

    const newStatus = over.id as TaskStatus
    const taskId    = active.id as string

    if (!COLUMNS.includes(newStatus)) return

    const prevStatus = moveTaskOptimistic(taskId, newStatus)
    if (!prevStatus) return

    try {
      await patchTaskStatus(taskId, newStatus)
    } catch {
      rollbackTaskStatus(taskId, prevStatus)
    }
  }

  return (
    <>
      <ViewHeader title="Tasks" viewToggle={viewToggle} />
      <KpiStrip tasks={tasks} />
      <div className="flex-1 overflow-x-auto snap-x snap-mandatory
                      bg-gradient-to-br from-slate-50 via-white to-slate-100/50
                      dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 p-4 md:px-5 md:py-4 h-full min-h-0">
            {COLUMNS.map((status) => (
              <KanbanColumn key={status} status={status} tasks={groups[status]} onTaskClick={handleTaskClick} />
            ))}
          </div>

          <DragOverlay dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
          }}>
            {activeTask && <TaskCard task={activeTask} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskDetailModal
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={(open) => { if (!open) setSelectedTaskId(null) }}
      />
    </>
  )
}
