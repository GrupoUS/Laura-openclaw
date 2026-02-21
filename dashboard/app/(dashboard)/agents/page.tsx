import { AgentsGrid } from '@/components/agents/AgentsGrid'
import type { ActivityEntry } from '@/hooks/useTaskStore'

export const dynamic = 'force-dynamic'

export default async function AgentsPage() {
  let agents: any[] = []
  let tasks: any[] = []
  let initialActivity: ActivityEntry[] = []

  try {
    const { getTasks, getAgentDetails, getRecentActivity } = await import('@/lib/db/queries')
    const [agentsData, tasksData, rawEvents] = await Promise.all([
      getAgentDetails(),
      getTasks({}),
      getRecentActivity(30),
    ])

    agents = agentsData
    tasks = tasksData

    initialActivity = rawEvents.map((e) => ({
      id:        e.id,
      type:      e.eventType,
      taskId:    e.taskId,
      taskTitle: (e as any).task?.title ?? undefined,
      agent:     e.agent,
      payload:   e.payload ? JSON.parse(e.payload as string) : {},
      ts:        e.createdAt.toISOString(),
    }))
  } catch (err) {
    console.error('[AgentsPage] Failed to fetch data:', err instanceof Error ? err.message : err)
  }

  return (
    <AgentsGrid
      initialAgents={agents}
      initialTasks={tasks}
      initialActivity={initialActivity}
    />
  )
}
