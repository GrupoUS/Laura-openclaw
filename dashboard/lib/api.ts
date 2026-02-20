import type { Task, Subtask, AgentSummary, TaskStatus } from '@/types/tasks'

const BASE = typeof window !== 'undefined'
  ? ''  // client: relative URL
  : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')

const headers = () => ({
  'Content-Type': 'application/json',
  'x-laura-secret': process.env.LAURA_API_SECRET ?? '',
})

// ─── Tasks ────────────────────────────────────────
export async function fetchTasks(filter?: {
  status?: TaskStatus; agent?: string; phase?: number
}): Promise<Task[]> {
  const params = new URLSearchParams()
  if (filter?.status) params.set('status', filter.status)
  if (filter?.agent)  params.set('agent',  filter.agent)
  if (filter?.phase)  params.set('phase',  String(filter.phase))
  const qs = params.toString() ? `?${params}` : ''
  const res = await fetch(`${BASE}/api/tasks${qs}`, { headers: headers(), cache: 'no-store' })
  if (!res.ok) throw new Error(`fetchTasks: ${res.status}`)
  return (await res.json()).data
}

export async function patchTaskStatus(
  id: string, status: TaskStatus, agent?: string
): Promise<Task> {
  const res = await fetch(`${BASE}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ status, agent }),
  })
  if (!res.ok) throw new Error(`patchTask: ${res.status}`)
  return (await res.json()).data
}

export async function patchSubtaskStatus(
  taskId: string, sid: string,
  status: 'todo' | 'doing' | 'done' | 'blocked'
): Promise<Subtask | null> {
  const res = await fetch(`${BASE}/api/tasks/${taskId}/subtasks/${sid}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ status }),
  })
  if (res.status === 409) return null  // race condition
  if (!res.ok) throw new Error(`patchSubtask: ${res.status}`)
  return (await res.json()).data
}

// ─── Agents ───────────────────────────────────────
export async function fetchAgents(): Promise<AgentSummary[]> {
  const res = await fetch(`${BASE}/api/agents`, { headers: headers(), cache: 'no-store' })
  if (!res.ok) throw new Error(`fetchAgents: ${res.status}`)
  return (await res.json()).data
}
