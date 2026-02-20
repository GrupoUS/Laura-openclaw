import { getTasks, getAgentDetails, getRecentActivity } from '@/lib/db/queries'
import { AgentsGrid } from '@/components/agents/AgentsGrid'
import type { ActivityEntry } from '@/hooks/useTaskStore'

export const dynamic = 'force-dynamic'

export default async function AgentsPage() {
  // Fetch paralelo — tudo direto no NeonDB, sem HTTP roundtrip
  const [agents, tasks, rawEvents] = await Promise.all([
    getAgentDetails(),
    getTasks({}),
    getRecentActivity(30),
  ])

  // Mapear task_events do NeonDB para ActivityEntry do Zustand
  const initialActivity: ActivityEntry[] = rawEvents.map((e) => ({
    id:        e.id,
    type:      e.eventType,
    taskId:    e.taskId,
    taskTitle: (e as any).task?.title ?? undefined,
    agent:     e.agent,
    payload:   e.payload ? JSON.parse(e.payload as string) : {},
    ts:        e.createdAt.toISOString(),
  }))

  return (
    <AgentsGrid
      initialAgents={agents}
      initialTasks={tasks as any}
      initialActivity={initialActivity}
    />
  )
}
