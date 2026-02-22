import { db } from './client'
import { tasks, subtasks, taskEvents } from './schema'
import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm'
import { notifyBlocked } from '@/server/notifications'

export type TaskFilter = {
  status?: 'backlog' | 'in_progress' | 'done' | 'blocked'
  agent?: string
  phase?: number
}

// ─── Helper — writes to task_events (fire-and-forget) ──────────────
async function logEvent(
  taskId: number,
  eventType: string,
  agent: string | null | undefined,
  payload: Record<string, unknown>
): Promise<void> {
  await db.insert(taskEvents).values({
    taskId,
    eventType,
    agent: agent ?? null,
    payload,
  })
}

// ─── Tasks ──────────────────────────────────────────────────────────────────
export async function getTasks(filter: TaskFilter) {
  const conditions = []
  if (filter.status) conditions.push(eq(tasks.status, filter.status))
  if (filter.agent)  conditions.push(eq(tasks.agent,  filter.agent))
  if (filter.phase)  conditions.push(eq(tasks.phase,  filter.phase))

  const taskRows = await db.select().from(tasks)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(tasks.updatedAt))
    .limit(100)

  if (taskRows.length === 0) return []

  const taskIds = taskRows.map(t => t.id)
  const subtaskRows = await db.select().from(subtasks)
    .where(inArray(subtasks.taskId, taskIds))
    .orderBy(asc(subtasks.phase), asc(subtasks.createdAt))

  const subtasksByTaskId = new Map<number, typeof subtaskRows>()
  for (const s of subtaskRows) {
    const arr = subtasksByTaskId.get(s.taskId) ?? []
    arr.push(s)
    subtasksByTaskId.set(s.taskId, arr)
  }

  return taskRows.map(t => ({
    ...t,
    id: String(t.id),
    subtasks: (subtasksByTaskId.get(t.id) ?? []).map(s => ({
      ...s,
      id: String(s.id),
      taskId: String(s.taskId),
    })),
  }))
}

export async function getTaskById(id: number) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
  if (!task) return undefined

  const [subs, events] = await Promise.all([
    db.select().from(subtasks).where(eq(subtasks.taskId, id)).orderBy(asc(subtasks.phase), asc(subtasks.createdAt)),
    db.select().from(taskEvents).where(eq(taskEvents.taskId, id)).orderBy(desc(taskEvents.createdAt)).limit(20),
  ])

  return { ...task, subtasks: subs, taskEvents: events }
}

export async function createTask(data: {
  title: string; description?: string
  phase?: number; priority?: 'low'|'medium'|'high'|'critical'; agent?: string
}) {
  const [task] = await db.insert(tasks).values(data).returning()
  logEvent(task.id, 'task:created', data.agent, { title: task.title, priority: task.priority })
    .catch(() => { /* fire-and-forget */ })
  return task
}

export async function updateTask(id: number, data: Partial<typeof tasks.$inferInsert>) {
  const [task] = await db.update(tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning()
  if (task) {
    logEvent(task.id, 'task:updated', data.agent ?? task.agent, {
      status: task.status, priority: task.priority
    }).catch(() => { /* fire-and-forget */ })
    
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
  taskId: number; title: string; phase?: number; agent?: string
}) {
  const [subtask] = await db.insert(subtasks).values(data).returning()
  logEvent(data.taskId, 'subtask:created', data.agent, { title: subtask.title })
    .catch(() => { /* fire-and-forget */ })
  return subtask
}

export async function updateSubtask(id: number, status: 'todo' | 'doing' | 'done' | 'blocked') {
  const [subtask] = await db.update(subtasks)
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
    }).catch(() => { /* fire-and-forget */ })

    if (status === 'blocked') {
      const parentTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, subtask.taskId),
        columns: { title: true, phase: true, priority: true },
      })
      if (parentTask) {
        notifyBlocked({
          event:     'subtask:blocked',
          taskId:    subtask.taskId,
          taskTitle: `${parentTask.title} → ${subtask.title}`,
          agent:     subtask.agent,
          phase:     parentTask.phase,
          priority:  parentTask.priority,
        })
      }
    }
  }
  return subtask ?? null
}

// ─── Agents Summary ───────────────────────────────────────────────────────────
export async function getAgentsSummary() {
  const result = await db.execute(
    sql`SELECT agent, status, COUNT(*)::int as count
     FROM tasks WHERE agent IS NOT NULL
     GROUP BY agent, status ORDER BY agent`
  )
  return result.rows
}

// ─── Agent Details ────────────────────────────────────────────────────────────
export async function getAgentDetails(): Promise<AgentDetail[]> {
  const { rows } = await db.execute(sql`
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

  const agents: Record<string, AgentDetail> = {}
  for (const row of rows as Record<string, unknown>[]) {
    const agentName = String(row.agent)
    if (!agents[agentName]) {
      agents[agentName] = {
        name:       String(row.agent),
        counts:     {},
        currentTask:    row.current_task_id ? {
          id: String(row.current_task_id), title: String(row.current_task_title), phase: Number(row.current_task_phase)
        } : null,
        currentSubtask: row.current_subtask_id ? {
          id: String(row.current_subtask_id), title: String(row.current_subtask_title)
        } : null,
        lastActive: row.last_active ? String(row.last_active) : null,
        status: 'idle',
      }
    }
    agents[agentName].counts[row.status as string] = Number(row.cnt)
  }

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

// ─── Activity Feed ─────────────────────────────────────────────────────
export async function getRecentActivity(limit = 30) {
  const events = await db.select({
    id: taskEvents.id,
    taskId: taskEvents.taskId,
    eventType: taskEvents.eventType,
    agent: taskEvents.agent,
    payload: taskEvents.payload,
    createdAt: taskEvents.createdAt,
    taskTitle: tasks.title,
  })
    .from(taskEvents)
    .leftJoin(tasks, eq(taskEvents.taskId, tasks.id))
    .orderBy(desc(taskEvents.createdAt))
    .limit(limit)

  return events.map(e => {
    const result = Object.assign({}, e, { task: { id: e.taskId, title: e.taskTitle ?? 'Unknown' } })
    return result
  })
}

// ─── Analytics Dashboard ───────────────────────────────────────────────
export interface AnalyticsData {
  kpis: {
    totalTasks:    number
    doneThisWeek:  number
    activeNow:     number
    blockedNow:    number
  }
  phaseProgress: Array<{
    phase:       number
    backlog:     number
    in_progress: number
    done:        number
    blocked:     number
    total:       number
    label:       string
  }>
  agentVelocity: Array<{
    agent:  string
    done:   number
    active: number
  }>
  statusDist: Array<{
    status: string
    count:  number
    label:  string
  }>
  completionTimeline: Array<{
    date:  string
    count: number
  }>
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const [kpiRows, phaseRows, agentRows, statusRows, timelineRows] = await Promise.all([
    db.execute(`
      SELECT
        COUNT(*)::int                                                           AS total_tasks,
        COUNT(*) FILTER (
          WHERE status = 'done'
          AND   updated_at >= NOW() - INTERVAL '7 days'
        )::int                                                                  AS done_this_week,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int                    AS active_now,
        COUNT(*) FILTER (WHERE status = 'blocked')::int                        AS blocked_now
      FROM tasks
    `),
    db.execute(`
      SELECT
        phase,
        COUNT(*) FILTER (WHERE status = 'backlog')::int     AS backlog,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE status = 'done')::int        AS done,
        COUNT(*) FILTER (WHERE status = 'blocked')::int     AS blocked,
        COUNT(*)::int                                        AS total
      FROM tasks
      GROUP BY phase
      ORDER BY phase ASC
    `),
    db.execute(`
      SELECT
        COALESCE(agent, 'system')                            AS agent,
        COUNT(*) FILTER (WHERE status = 'done')::int        AS done,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS active
      FROM tasks
      WHERE agent IS NOT NULL
      GROUP BY agent
      ORDER BY done DESC
    `),
    db.execute(`
      SELECT status, COUNT(*)::int AS count
      FROM tasks
      GROUP BY status
    `),
    db.execute(`
      SELECT
        TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM') AS date,
        COUNT(*)::int AS count
      FROM task_events
      WHERE event_type  = 'task:updated'
        AND payload::jsonb->>'status' = 'done'
        AND created_at >= NOW() - INTERVAL '14 days'
      GROUP BY date
      ORDER BY MIN(created_at) ASC
    `),
  ])

  const kpi = (kpiRows.rows[0] ?? {}) as Record<string, unknown>
  const STATUS_LABELS: Record<string, string> = {
    backlog: '📋 Backlog', in_progress: '⚡ Em Progresso',
    done: '✅ Concluído', blocked: '🔴 Bloqueado',
  }

  return {
    kpis: {
      totalTasks:   Number(kpi.total_tasks)   || 0,
      doneThisWeek: Number(kpi.done_this_week)|| 0,
      activeNow:    Number(kpi.active_now)    || 0,
      blockedNow:   Number(kpi.blocked_now)   || 0,
    },
    phaseProgress: (phaseRows.rows as Record<string, unknown>[]).map((r) => ({
      phase: Number(r.phase), backlog: Number(r.backlog), in_progress: Number(r.in_progress),
      done: Number(r.done), blocked: Number(r.blocked), total: Number(r.total),
      label: 'Fase ' + r.phase,
    })),
    agentVelocity: (agentRows.rows as Record<string, unknown>[]).map((r) => ({
      agent: String(r.agent), done: Number(r.done), active: Number(r.active),
    })),
    statusDist: (statusRows.rows as Record<string, unknown>[]).map((r) => ({
      status: String(r.status), count: Number(r.count),
      label: STATUS_LABELS[String(r.status)] ?? String(r.status),
    })),
    completionTimeline: (timelineRows.rows as Record<string, unknown>[]).map((r) => ({
      date: String(r.date), count: Number(r.count),
    })),
  }
}
