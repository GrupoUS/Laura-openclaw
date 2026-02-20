import { getTasks } from '@/lib/db/queries'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import type { Task } from '@/types/tasks'

export const dynamic = 'force-dynamic'

export default async function BoardPage() {
  const tasks = await getTasks({})
  return <KanbanBoard initialTasks={tasks as unknown as Task[]} />
}
