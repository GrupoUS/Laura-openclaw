/**
 * REST API endpoints for OpenClaw agents
 * Auth: x-laura-secret header (validated inline)
 * Reuses existing query layer from db/queries.ts
 */
import { Hono } from 'hono'
import { z } from 'zod'
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  createSubtask,
  updateSubtask,
  getAgentsSummary,
} from '../db/queries'
import { eventBus } from '../events/emitter'

const api = new Hono()

// ── Auth middleware — validates x-laura-secret for all routes ────────
api.use('*', async (c, next) => {
  const secret = c.req.header('x-laura-secret')
  if (!secret || secret !== process.env.LAURA_API_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  return next()
})

// ── Zod Schemas (Zod v4) ────────────────────────────────────────────
const taskStatusSchema = z.enum(['backlog', 'in_progress', 'done', 'blocked'])
const prioritySchema = z.enum(['low', 'medium', 'high', 'critical'])
const subtaskStatusSchema = z.enum(['todo', 'doing', 'done', 'blocked'])

const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  phase: z.number().int().min(1).default(1),
  priority: prioritySchema.default('medium'),
  agent: z.string().optional(),
})

const patchTaskSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  agent: z.string().optional(),
})

const createSubtaskSchema = z.object({
  title: z.string().min(3).max(300),
  phase: z.number().int().min(1).default(1),
  agent: z.string().optional(),
})

const patchSubtaskSchema = z.object({
  status: subtaskStatusSchema,
})

// ── GET /api/tasks — List tasks with optional filters ───────────────
api.get('/', async (c) => {
  const status = c.req.query('status') as
    | 'backlog'
    | 'in_progress'
    | 'done'
    | 'blocked'
    | undefined
  const agent = c.req.query('agent') ?? undefined
  const phaseRaw = c.req.query('phase')
  const phase = phaseRaw ? Number(phaseRaw) : undefined

  const data = await getTasks({ status, agent, phase })
  return c.json({ data, count: data.length })
})

// ── POST /api/tasks — Create a new task ─────────────────────────────
api.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      422
    )
  }
  const task = await createTask(parsed.data)
  eventBus.publish({
    type: 'task:created',
    taskId: task.id,
    payload: task as unknown as Record<string, unknown>,
    agent: parsed.data.agent,
    ts: new Date().toISOString(),
  })
  return c.json({ data: task }, 201)
})

// ── GET /api/tasks/:id — Get task detail with subtasks + events ─────
api.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const task = await getTaskById(id)
  if (!task) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: task })
})

// ── PATCH /api/tasks/:id — Update task status/priority/agent ────────
api.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const body = await c.req.json().catch(() => null)
  const parsed = patchTaskSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      422
    )
  }

  const task = await updateTask(id, parsed.data)
  if (!task) return c.json({ error: 'Not found' }, 404)

  eventBus.publish({
    type: 'task:updated',
    taskId: task.id,
    payload: task as unknown as Record<string, unknown>,
    agent: parsed.data.agent ?? task.agent ?? undefined,
    ts: new Date().toISOString(),
  })
  return c.json({ data: task })
})

// ── POST /api/tasks/:id/subtasks — Create subtask ───────────────────
api.post('/:id/subtasks', async (c) => {
  const taskId = Number(c.req.param('id'))
  if (Number.isNaN(taskId)) return c.json({ error: 'Invalid task ID' }, 400)

  const body = await c.req.json().catch(() => null)
  const parsed = createSubtaskSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      422
    )
  }

  const subtask = await createSubtask({ ...parsed.data, taskId })
  eventBus.publish({
    type: 'subtask:created',
    taskId,
    payload: subtask as unknown as Record<string, unknown>,
    agent: parsed.data.agent,
    ts: new Date().toISOString(),
  })
  return c.json({ data: subtask }, 201)
})

// ── PATCH /api/tasks/:id/subtasks/:sid — Update subtask status ──────
api.patch('/:id/subtasks/:sid', async (c) => {
  const sid = Number(c.req.param('sid'))
  if (Number.isNaN(sid))
    return c.json({ error: 'Invalid subtask ID' }, 400)

  const body = await c.req.json().catch(() => null)
  const parsed = patchSubtaskSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      422
    )
  }

  const subtask = await updateSubtask(sid, parsed.data.status)
  if (!subtask) {
    return c.json(
      {
        error:
          'Not found or race condition — subtask already claimed by another agent',
      },
      409
    )
  }

  eventBus.publish({
    type: 'subtask:updated',
    taskId: Number(c.req.param('id')),
    payload: subtask as unknown as Record<string, unknown>,
    ts: new Date().toISOString(),
  })
  return c.json({ data: subtask })
})

// ── GET /api/tasks/agents — Agent summary panel ─────────────────────
api.get('/agents', async (c) => {
  const rows = await getAgentsSummary()
  const agents: Record<
    string,
    { name: string; counts: Record<string, number>; activeTasks: number }
  > = {}

  for (const row of rows as Record<string, unknown>[]) {
    const agentName = String(row.agent)
    if (!agents[agentName]) {
      agents[agentName] = { name: agentName, counts: {}, activeTasks: 0 }
    }
    agents[agentName].counts[String(row.status)] = Number(row.count)
    if (row.status === 'in_progress') {
      agents[agentName].activeTasks = Number(row.count)
    }
  }

  return c.json({ data: Object.values(agents) })
})

export { api as apiTasksRoutes }
