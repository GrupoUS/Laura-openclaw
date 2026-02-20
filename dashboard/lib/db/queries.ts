import { db } from '../db'
import { tasks, subtasks } from './schema'
import { eq, and, desc, sql } from 'drizzle-orm'

function getDb(): NonNullable<typeof db> {
  if (!db) throw new Error('Database not configured — NEON_DATABASE_URL is missing')
  return db
}

export type TaskFilter = {
  status?: 'backlog' | 'in_progress' | 'done' | 'blocked'
  agent?: string
  phase?: number
}

export async function getTasks(filter: TaskFilter) {
  const conditions = []
  if (filter.status) conditions.push(eq(tasks.status, filter.status))
  if (filter.agent)  conditions.push(eq(tasks.agent, filter.agent))
  if (filter.phase)  conditions.push(eq(tasks.phase, filter.phase))

  return getDb().query.tasks.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      subtasks: {
        orderBy: (s, { asc }) => [asc(s.phase), asc(s.createdAt)],
      },
    },
    orderBy: [desc(tasks.updatedAt)],
    limit: 100,
  })
}

export async function getTaskById(id: string) {
  return getDb().query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: {
      subtasks: true,
      taskEvents: {
        orderBy: (e, { desc: d }) => [d(e.createdAt)],
        limit: 20,
      },
    },
  })
}

export async function createTask(data: {
  title: string
  description?: string
  phase?: number
  priority?: 'low' | 'medium' | 'high' | 'critical'
  agent?: string
}) {
  const [task] = await getDb().insert(tasks).values(data).returning()
  return task
}

export async function updateTask(
  id: string,
  data: Partial<typeof tasks.$inferInsert>,
) {
  const [task] = await getDb()
    .update(tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning()
  return task ?? null
}

export async function createSubtask(data: {
  taskId: string
  title: string
  phase?: number
  agent?: string
}) {
  const [subtask] = await getDb().insert(subtasks).values(data).returning()
  return subtask
}

export async function updateSubtask(
  id: string,
  status: 'todo' | 'doing' | 'done' | 'blocked',
) {
  // ATOMIC: prevents race condition — only transitions from 'todo' to 'doing'
  const [subtask] = await getDb()
    .update(subtasks)
    .set({
      status,
      completedAt: status === 'done' ? new Date() : null,
    })
    .where(
      status === 'doing'
        ? and(eq(subtasks.id, id), eq(subtasks.status, 'todo'))
        : eq(subtasks.id, id),
    )
    .returning()
  return subtask ?? null
}

export async function getAgentsSummary() {
  const result = await getDb().execute(
    sql`SELECT agent, status, COUNT(*)::int as count
        FROM tasks
        WHERE agent IS NOT NULL
        GROUP BY agent, status
        ORDER BY agent`,
  )
  return result.rows
}
