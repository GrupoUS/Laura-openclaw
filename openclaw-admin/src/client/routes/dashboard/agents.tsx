import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AgentsGrid } from '@/client/components/dashboard/agents/AgentsGrid'
import { useTaskStore, type ActivityEntry } from '@/client/hooks/useTaskStore'
import { trpc } from '@/client/trpc'

export const Route = createFileRoute('/dashboard/agents')({
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
    if (tasksData?.data) setTasks(tasksData.data as any[])
  }, [tasksData, setTasks])

  const initialActivity: ActivityEntry[] = (activityData?.data ?? []).map((e: any) => ({
    id:        e.id,
    type:      e.eventType,
    taskId:    e.taskId,
    taskTitle: e.task?.title ?? undefined,
    agent:     e.agent,
    payload:   e.payload ? JSON.parse(e.payload as string) : {},
    ts:        e.createdAt,
  }))

  return (
    <AgentsGrid
      initialAgents={agentsData?.data ?? []}
      initialTasks={tasksData?.data as any[] ?? []}
      initialActivity={initialActivity}
    />
  )
}
