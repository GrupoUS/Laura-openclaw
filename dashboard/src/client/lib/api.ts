/**
 * Client-side API compatibility layer
 * Wraps fetch calls to tRPC/dashboard endpoints
 * Components that still use these helpers will work seamlessly
 */
import type { Task, Subtask, AgentSummary, TaskStatus } from '@/shared/types/tasks'

// ─── Tasks ────────────────────────────────────────
export async function fetchTasks(filter?: {
  status?: TaskStatus; agent?: string; phase?: number
}): Promise<Task[]> {
  const input = filter ? JSON.stringify({ json: filter }) : JSON.stringify({ json: {} })
  const res = await fetch(`/trpc/tasks.list?input=${encodeURIComponent(input)}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`fetchTasks: ${res.status}`)
  const json = await res.json()
  return json.result?.data?.json?.data ?? json.result?.data?.data ?? []
}

export async function patchTaskStatus(
  id: string, status: TaskStatus, agent?: string
): Promise<Task> {
  const res = await fetch('/trpc/tasks.update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ json: { id, status, agent } }),
  })
  if (!res.ok) throw new Error(`patchTask: ${res.status}`)
  const json = await res.json()
  return json.result?.data?.json?.data ?? json.result?.data?.data
}

export async function patchSubtaskStatus(
  taskId: string, sid: string,
  status: 'todo' | 'doing' | 'done' | 'blocked'
): Promise<Subtask | null> {
  const res = await fetch('/trpc/tasks.updateSubtask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ json: { taskId, sid, status } }),
  })
  if (res.status === 409) return null
  if (!res.ok) throw new Error(`patchSubtask: ${res.status}`)
  const json = await res.json()
  return json.result?.data?.json?.data ?? json.result?.data?.data
}

export async function createTask(data: Record<string, unknown>): Promise<Task> {
  const res = await fetch('/trpc/tasks.create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ json: data }),
  })
  if (!res.ok) throw new Error(`createTask: ${res.status}`)
  const json = await res.json()
  return json.result?.data?.json?.data ?? json.result?.data?.data
}

export async function createSubtask(data: Record<string, unknown>): Promise<Subtask> {
  const res = await fetch(`/trpc/tasks.createSubtask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ json: data }),
  })
  if (!res.ok) throw new Error(`createSubtask: ${res.status}`)
  const json = await res.json()
  return json.result?.data?.json?.data ?? json.result?.data?.data
}

// ─── Agents ───────────────────────────────────────
export async function fetchAgents(): Promise<AgentSummary[]> {
  const res = await fetch('/trpc/dashboardAgents.list', { credentials: 'include' })
  if (!res.ok) throw new Error(`fetchAgents: ${res.status}`)
  const json = await res.json()
  return json.result?.data?.json?.data ?? json.result?.data?.data ?? []
}
