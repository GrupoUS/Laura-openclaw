
import { useEffect, useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { useTaskStore } from '@/client/hooks/useTaskStore'
import { useTaskEvents } from '@/client/hooks/useTaskEvents'
import { patchTaskStatus } from '@/client/lib/api'
import { ViewHeader } from '@/client/components/dashboard/layout/ViewHeader'
import type { Task, TaskStatus } from '@/shared/types/tasks'

const COLUMNS: TaskStatus[] = ['backlog', 'in_progress', 'done', 'blocked']

export function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const setTasks             = useTaskStore((s) => s.setTasks)
  const moveTaskOptimistic   = useTaskStore((s) => s.moveTaskOptimistic)
  const rollbackTaskStatus   = useTaskStore((s) => s.rollbackTaskStatus)

  useEffect(() => { setTasks(initialTasks) }, [initialTasks, setTasks])

  // Connect SSE
  useTaskEvents()

  const groups = useTaskStore((s) => s.tasksByStatus())
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
      // 3. Rollback on failure
      rollbackTaskStatus(taskId, prevStatus)
      console.error(`[KanbanBoard] Failed to move task ${taskId} → rolling back to ${prevStatus}`)
    }
  }

  return (
    <>
      <ViewHeader title="🗂️ Kanban Board" />
      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 p-6 h-full">
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
