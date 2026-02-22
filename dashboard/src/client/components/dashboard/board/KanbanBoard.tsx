
import { useEffect, useMemo, useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { useTaskStore } from '@/client/hooks/useTaskStore'
import { patchTaskStatus } from '@/client/lib/api'
import { ViewHeader } from '@/client/components/dashboard/layout/ViewHeader'
import type { Task, TaskStatus } from '@/shared/types/tasks'

const COLUMNS: TaskStatus[] = ['backlog', 'in_progress', 'done', 'blocked']

export function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
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

    // 1. Optimistic update
    const prevStatus = moveTaskOptimistic(taskId, newStatus)
    if (!prevStatus) return

    try {
      // 2. Persist to NeonDB
      await patchTaskStatus(taskId, newStatus)
    } catch {
      // Rollback on failure
      rollbackTaskStatus(taskId, prevStatus)
    }
  }

  return (
    <>
      <ViewHeader title="🗂️ Kanban Board" />
      <div className="flex-1 overflow-x-auto snap-x snap-mandatory">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 p-4 md:p-6 h-full">
            {COLUMNS.map((status) => (
              <KanbanColumn key={status} status={status} tasks={groups[status]} />
            ))}
          </div>

          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  )
}
