import { TaskList } from '@/components/list/TaskList'
import type { Task } from '@/types/tasks'

export const dynamic = 'force-dynamic'

export default async function ListPage() {
  let tasks: Task[] = []

  try {
    const { getTasks } = await import('@/lib/db/queries')
    const result = await getTasks({})
    tasks = result as unknown as Task[]
  } catch (err) {
    console.error('[ListPage] Failed to fetch tasks:', err instanceof Error ? err.message : err)
  }

  return <TaskList initialTasks={tasks} />
}
