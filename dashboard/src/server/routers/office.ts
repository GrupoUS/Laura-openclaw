import { router, publicProcedure } from '../trpc-init'
import { gatewayCall } from '../ws/openclaw'
import { db } from '../db/client'
import { tasks, subtasks } from '../db/schema'
import { eq } from 'drizzle-orm'
import { eventBus } from '../events/emitter'
import { z } from 'zod'

const AGENTS = [
  { id: 'main',     name: 'Laura',   emoji: '💜', color: 'purple', tier: 'Top' },
  { id: 'claudete', name: 'Claudete',emoji: '🎭', color: 'indigo', tier: 'Top' },
  { id: 'cris',     name: 'Cris',    emoji: '💎', color: 'teal',   tier: 'Top' },
  { id: 'celso',    name: 'Celso',   emoji: '📣', color: 'orange', tier: 'Dir' },
  { id: 'flora',    name: 'Flora',   emoji: '🌿', color: 'blue',   tier: 'Dir' },
  { id: 'otto',     name: 'Otto',    emoji: '⚙️', color: 'green',  tier: 'Dir' },
  { id: 'mila',     name: 'Mila',    emoji: '🌸', color: 'pink',   tier: 'Dir' },
  { id: 'coder',    name: 'Coder',   emoji: '💻', color: 'blue',   tier: 'Builder' },
  { id: 'cs',       name: 'CS',      emoji: '🎓', color: 'pink',   tier: 'Builder' },
  { id: 'suporte',  name: 'Suporte', emoji: '🗂️', color: 'green',  tier: 'Builder' },
  { id: 'rafa',     name: 'Rafa',    emoji: '✍️', color: 'orange', tier: 'Mkt' },
  { id: 'duda',     name: 'Duda',    emoji: '📸', color: 'pink',   tier: 'Mkt' },
  { id: 'maia',     name: 'Maia',    emoji: '🎬', color: 'purple', tier: 'Mkt' },
  { id: 'luca-t',   name: 'Luca T.', emoji: '📊', color: 'yellow', tier: 'Mkt' },
  { id: 'sara',     name: 'Sara',    emoji: '🎯', color: 'green',  tier: 'Mkt' },
  { id: 'malu',     name: 'Malu',    emoji: '🤝', color: 'pink',   tier: 'Mkt' },
  { id: 'dora',     name: 'Dora',    emoji: '🗺️', color: 'blue',   tier: 'Prod' },
] as const

export const officeRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    // 1. Gateway sessions (best-effort)
    let activeSessions: Record<string, unknown>[] = []
    try {
      const result = await gatewayCall<unknown>('sessions_list', {}, ctx.gatewayToken)
      activeSessions = Array.isArray(result) ? (result as Record<string, unknown>[]) : []
    } catch {
      // Gateway offline — fall through to NeonDB
    }

    // 2. NeonDB in_progress tasks per agent (reliable source of truth)
    const inProgressTasks = await db
      .select({ agent: tasks.agent, title: tasks.title, id: tasks.id })
      .from(tasks)
      .where(eq(tasks.status, 'in_progress'))

    const agentInProgress = new Map<string, { title: string; id: string }>()
    for (const t of inProgressTasks) {
      if (t.agent) agentInProgress.set(t.agent, { title: t.title, id: String(t.id) })
    }

    // 3. NeonDB in_progress subtasks (more granular — shows what the agent is doing right now)
    const inProgressSubtasks = await db
      .select({ agent: subtasks.agent, title: subtasks.title, taskId: subtasks.taskId })
      .from(subtasks)
      .where(eq(subtasks.status, 'doing'))

    const agentDoingSubtask = new Map<string, string>()
    for (const s of inProgressSubtasks) {
      if (s.agent) agentDoingSubtask.set(s.agent, s.title)
    }

    return AGENTS.map((agent) => {
      const session = activeSessions.find(
        (s) => typeof s.agentId === 'string' && s.agentId === agent.id
      )

      // Determine status: in_progress task or doing subtask → active
      const hasActiveTask   = agentInProgress.has(agent.id)
      const hasDoingSubtask = agentDoingSubtask.has(agent.id)
      const hasSession      = !!session

      const status: 'active' | 'standby' | 'idle' =
        hasActiveTask || hasDoingSubtask
          ? 'active'
          : hasSession
            ? (session?.isActive ? 'active' : 'standby')
            : 'idle'

      const currentTask = agentDoingSubtask.get(agent.id)
        ?? agentInProgress.get(agent.id)?.title
        ?? (session ? (session.currentTask as string | undefined) : undefined)

      return {
        id: agent.id,
        name: agent.name,
        emoji: agent.emoji,
        color: agent.color,
        tier: agent.tier,
        status,
        lastActivity: session ? (session.lastActivity as string | undefined) : undefined,
        currentTask,
      }
    })
  }),

  /** Publish agent status change via SSE — called by Laura or sub-agents */
  publishStatus: publicProcedure
    .input(z.object({
      agentId:       z.string(),
      status:        z.enum(['active', 'standby', 'idle']),
      currentAction: z.string().optional(),
    }))
    .mutation(({ input }) => {
      eventBus.publish({
        type: 'agent:status',
        taskId: 0,
        payload: {
          agentId:       input.agentId,
          status:        input.status,
          currentAction: input.currentAction ?? '',
        },
        agent: input.agentId,
        ts: new Date().toISOString(),
      })
      return { ok: true }
    }),
})
