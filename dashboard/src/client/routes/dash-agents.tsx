import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AgentsGrid } from '@/client/components/dashboard/agents/AgentsGrid'
import { useTaskStore, type ActivityEntry } from '@/client/hooks/useTaskStore'
import { trpc } from '@/client/trpc'
import type { Task } from '@/shared/types/tasks'

export const Route = createFileRoute('/dash-agents')({
  component: AgentsPage,
})

function AgentsPage() {
  const setAgentDetails = useTaskStore((s) => s.setAgentDetails)
  const setTasks = useTaskStore((s) => s.setTasks)

  const { data: agentsData } = trpc.dashboardAgents.list.useQuery()
  const { data: tasksData } = trpc.tasks.list.useQuery()
  const { data: activityData } = trpc.activity.list.useQuery({ limit: 30 })

  useEffect(() => {
    if (agentsData?.data) setAgentDetails(agentsData.data)
  }, [agentsData, setAgentDetails])

  useEffect(() => {
    if (tasksData?.data) setTasks(tasksData.data as unknown as Task[])
  }, [tasksData, setTasks])

  const initialActivity: ActivityEntry[] = (activityData?.data ?? []).map((e) => ({
    id:        String(e.id),
    type:      e.eventType,
    taskId:    String(e.taskId),
    taskTitle: (e as unknown as { task?: { title?: string } }).task?.title ?? undefined,
    agent:     e.agent,
    payload:   typeof e.payload === 'string' ? JSON.parse(e.payload) : ((e.payload as Record<string, unknown>) ?? {}),
    ts:        e.createdAt,
  }))

  return (
    <AgentsGrid
      initialAgents={agentsData?.data ?? []}
      initialTasks={tasksData?.data as unknown as Task[] ?? []}
      initialActivity={initialActivity}
    />
  )
}
