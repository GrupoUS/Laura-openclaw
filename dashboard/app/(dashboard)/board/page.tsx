import { KanbanBoard } from '@/components/board/KanbanBoard'
import type { Task } from '@/types/tasks'

export const dynamic = 'force-dynamic'

export default async function BoardPage() {
  let tasks: Task[] = []

  try {
    const { getTasks } = await import('@/lib/db/queries')
    const result = await getTasks({})
    tasks = result as unknown as Task[]
  } catch (err) {
    console.error('[BoardPage] Failed to fetch tasks:', err instanceof Error ? err.message : err)
  }

  return <KanbanBoard initialTasks={tasks} />
}
