import { getDb } from '../db'
import { tasks, subtasks, taskEvents } from './schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { notifyBlocked } from '@/lib/notifications'

export type TaskFilter = {
  status?: 'backlog' | 'in_progress' | 'done' | 'blocked'
  agent?: string
  phase?: number
}

// ─── Helper interno — escreve em task_events (fire-and-forget) ──────────────
async function logEvent(
  taskId: string,
  eventType: string,
  agent: string | null | undefined,
  payload: Record<string, unknown>
): Promise<void> {
  await getDb().insert(taskEvents).values({
    taskId,
    eventType,
    agent: agent ?? null,
    payload: JSON.stringify(payload),
  })
}

// ─── Tasks ──────────────────────────────────────────────────────────────────
export async function getTasks(filter: TaskFilter) {
  const conditions = []
  if (filter.status) conditions.push(eq(tasks.status, filter.status))
  if (filter.agent)  conditions.push(eq(tasks.agent,  filter.agent))
  if (filter.phase)  conditions.push(eq(tasks.phase,  filter.phase))
  return getDb().query.tasks.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: { subtasks: { orderBy: (s, { asc }) => [asc(s.phase), asc(s.createdAt)] } },
    orderBy: [desc(tasks.updatedAt)],
    limit: 100,
  })
}

export async function getTaskById(id: string) {
  return getDb().query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: {
      subtasks: true,
      taskEvents: { orderBy: (e, { desc }) => [desc(e.createdAt)], limit: 20 },
    },
  })
}

export async function createTask(data: {
  title: string; description?: string
  phase?: number; priority?: 'low'|'medium'|'high'|'critical'; agent?: string
}) {
  const [task] = await getDb().insert(tasks).values(data).returning()
  // Registrar no feed — fire-and-forget (não bloqueia resposta HTTP)
  logEvent(task.id, 'task:created', data.agent, { title: task.title, priority: task.priority })
    .catch((e) => console.error('[queries] logEvent task:created:', e.message))
  return task
}

export async function updateTask(id: string, data: Partial<typeof tasks.$inferInsert>) {
  const [task] = await getDb().update(tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning()
  if (task) {
    logEvent(task.id, 'task:updated', data.agent ?? task.agent, {
      status: task.status, priority: task.priority
    }).catch((e) => console.error('[queries] logEvent task:updated:', e.message))
    
    if (data.status === 'blocked') {
      notifyBlocked({
        event:     'task:blocked',
        taskId:    task.id,
        taskTitle: task.title,
        agent:     data.agent ?? task.agent,
        phase:     task.phase,
        priority:  task.priority,
      })
    }
  }
  return task
}

export async function createSubtask(data: {
  taskId: string; title: string; phase?: number; agent?: string
}) {
  const [subtask] = await getDb().insert(subtasks).values(data).returning()
  logEvent(data.taskId, 'subtask:created', data.agent, { title: subtask.title })
    .catch((e) => console.error('[queries] logEvent subtask:created:', e.message))
  return subtask
}

export async function updateSubtask(id: string, status: 'todo' | 'doing' | 'done' | 'blocked') {
  const [subtask] = await getDb().update(subtasks)
    .set({
      status,
      completedAt: status === 'done' ? new Date() : null,
    })
    .where(
      status === 'doing'
        ? and(eq(subtasks.id, id), eq(subtasks.status, 'todo'))
        : eq(subtasks.id, id)
    )
    .returning()
  if (subtask) {
    logEvent(subtask.taskId, 'subtask:updated', subtask.agent, {
      subtaskId: subtask.id, title: subtask.title, status
    }).catch((e) => console.error('[queries] logEvent subtask:updated:', e.message))

    if (status === 'blocked') {
      const parentTask = await getDb().query.tasks.findFirst({
        where: eq(tasks.id, subtask.taskId),
        columns: { title: true, phase: true, priority: true },
      })
      if (parentTask) {
        notifyBlocked({
          event:     'subtask:blocked',
          taskId:    subtask.taskId,
          taskTitle: `${parentTask.title} \u2192 ${subtask.title}`,
          agent:     subtask.agent,
          phase:     parentTask.phase,
          priority:  parentTask.priority,
        })
      }
    }
  }
  return subtask ?? null
}

// ─── Agents Summary (já existia — mantido) ───────────────────────────────────
export async function getAgentsSummary() {
  const result = await getDb().execute(
    sql`SELECT agent, status, COUNT(*)::int as count
     FROM tasks WHERE agent IS NOT NULL
     GROUP BY agent, status ORDER BY agent`
  )
  return result.rows
}

// ─── Agent Details — NOVA ────────────────────────────────────────────────────
// Retorna todos os agentes únicos com:
// - contagem de tasks por status
// - task atual (in_progress)
// - subtask atual (doing)
// - timestamp da última atividade
export async function getAgentDetails(): Promise<AgentDetail[]> {
  const { rows } = await getDb().execute(sql`
    WITH agent_tasks AS (
      SELECT
        COALESCE(t.agent, 'system') AS agent,
        t.id        AS task_id,
        t.title     AS task_title,
        t.status    AS task_status,
        t.phase     AS task_phase,
        t.updated_at
      FROM tasks t
    ),
    agent_subtasks AS (
      SELECT
        COALESCE(s.agent, t.agent, 'system') AS agent,
        s.id    AS subtask_id,
        s.title AS subtask_title,
        s.status AS subtask_status
      FROM subtasks s
      JOIN tasks t ON s.task_id = t.id
      WHERE s.status = 'doing'
    ),
    last_events AS (
      SELECT
        COALESCE(agent, 'system') AS agent,
        MAX(created_at) AS last_active
      FROM task_events
      GROUP BY agent
    ),
    agent_counts AS (
      SELECT agent, status, COUNT(*)::int AS cnt
      FROM agent_tasks
      GROUP BY agent, status
    )
    SELECT
      ac.agent,
      ac.status,
      ac.cnt,
      at2.task_id    AS current_task_id,
      at2.task_title AS current_task_title,
      at2.task_phase AS current_task_phase,
      asub.subtask_id    AS current_subtask_id,
      asub.subtask_title AS current_subtask_title,
      le.last_active
    FROM agent_counts ac
    LEFT JOIN agent_tasks at2
      ON ac.agent = at2.agent AND at2.task_status = 'in_progress'
    LEFT JOIN agent_subtasks asub ON ac.agent = asub.agent
    LEFT JOIN last_events le ON ac.agent = le.agent
    ORDER BY ac.agent, ac.status
  `)

  // Agregar por agente
  const agents: Record<string, AgentDetail> = {}
  for (const row of rows as any[]) {
    if (!agents[row.agent]) {
      agents[row.agent] = {
        name:       row.agent,
        counts:     {},
        currentTask:    row.current_task_id ? {
          id: row.current_task_id, title: row.current_task_title, phase: row.current_task_phase
        } : null,
        currentSubtask: row.current_subtask_id ? {
          id: row.current_subtask_id, title: row.current_subtask_title
        } : null,
        lastActive: row.last_active ?? null,
        status: 'idle',
      }
    }
    agents[row.agent].counts[row.status as string] = row.cnt
  }

  // Derivar status visual do agente
  for (const agent of Object.values(agents)) {
    if (agent.currentSubtask)               agent.status = 'doing'
    else if (agent.counts['in_progress'])   agent.status = 'active'
    else if (agent.counts['blocked'])       agent.status = 'blocked'
    else                                    agent.status = 'idle'
  }

  return Object.values(agents)
}

export interface AgentDetail {
  name:    string
  status:  'doing' | 'active' | 'blocked' | 'idle'
  counts:  Partial<Record<string, number>>
  currentTask:    { id: string; title: string; phase: number } | null
  currentSubtask: { id: string; title: string } | null
  lastActive: string | null
}

// ─── Activity Feed — NOVA ─────────────────────────────────────────────────────
export async function getRecentActivity(limit = 30) {
  return getDb().query.taskEvents.findMany({
    orderBy: (e, { desc }) => [desc(e.createdAt)],
    limit,
    with: { task: { columns: { id: true, title: true } } },
  })
}
