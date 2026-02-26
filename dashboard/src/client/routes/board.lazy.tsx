import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { KanbanBoard } from '@/client/components/dashboard/board/KanbanBoard'
import { useTaskStore } from '@/client/hooks/useTaskStore'
import { trpc } from '@/client/trpc'
import type { Task } from '@/shared/types/tasks'

export const Route = createLazyFileRoute('/board')({
  component: BoardPage,
})

function BoardPage() {
  const setTasks = useTaskStore((s) => s.setTasks)
  const { data, isLoading } = trpc.tasks.list.useQuery()

  useEffect(() => {
    if (data?.data) {
      setTasks(data.data as unknown as Task[])
    }
  }, [data, setTasks])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <KanbanBoard initialTasks={data?.data as unknown as Task[] ?? []} />
}
