import { router, publicProcedure } from '../trpc-init'
import { gatewayCall } from '../ws/openclaw'

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
    let activeSessions: Record<string, unknown>[] = []
    try {
      const result = await gatewayCall<unknown>('sessions_list', {}, ctx.gatewayToken)
      activeSessions = Array.isArray(result) ? (result as Record<string, unknown>[]) : []
    } catch {
      // Gateway offline — all agents idle
    }

    return AGENTS.map((agent) => {
      const session = activeSessions.find(
        (s) => typeof s.agentId === 'string' && s.agentId === agent.id
      )
      const status: 'active' | 'standby' | 'idle' = !session
        ? 'idle'
        : session.isActive
          ? 'active'
          : 'standby'

      return {
        id: agent.id,
        name: agent.name,
        emoji: agent.emoji,
        color: agent.color,
        tier: agent.tier,
        status,
        lastActivity: session ? (session.lastActivity as string | undefined) : undefined,
        currentTask: session ? (session.currentTask as string | undefined) : undefined,
      }
    })
  }),
})
