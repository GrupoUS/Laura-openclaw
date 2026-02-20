import { getTasks } from '@/lib/db/queries'
import { TaskList } from '@/components/list/TaskList'
import type { Task } from '@/types/tasks'

export const dynamic = 'force-dynamic'

export default async function ListPage() {
  const tasks = await getTasks({})
  return <TaskList initialTasks={tasks as unknown as Task[]} />
}
