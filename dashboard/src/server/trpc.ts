import { z } from 'zod'
import { gatewayCall, getGatewayUrl, getGatewayWs, isGatewayConnected } from './ws/openclaw'
import { router, publicProcedure } from './trpc-init'
import { evolutionRouter } from './routers/evolution'
import { tasksRouter } from './routers/tasks'
import { dashboardAgentsRouter } from './routers/dashboard-agents'
import { analyticsRouter } from './routers/analytics'
import { activityRouter } from './routers/activity'
import { calendarRouter } from './routers/calendar'
import { orchestrationRouter } from './routers/orchestration'
import { officeRouter } from './routers/office'
import { contentRouter } from './routers/content'
import { sdrRouter } from './routers/sdr'

// Re-export primitives so existing imports from './trpc' still work
export { router, publicProcedure } from './trpc-init'
export type { Context } from './trpc-init'

// Routers
const gatewayRouter = router({
  health: publicProcedure.query(async ({ ctx }) => {
    const targetUrl = getGatewayUrl()
    try {
      const result = await gatewayCall<Record<string, unknown>>('health', {}, ctx.gatewayToken)
      return { connected: true, targetUrl, ...result }
    } catch (err) {
      return { connected: false, targetUrl, error: (err as Error).message }
    }
  }),
  status: publicProcedure.query(() => {
    // Eagerly initiate WS connection so subsequent polls see it as connected
    if (!isGatewayConnected()) {
      try { getGatewayWs() } catch { /* connection will complete async */ }
    }
    return { connected: isGatewayConnected(), url: getGatewayUrl() }
  }),
  patch: publicProcedure
    .input(z.object({ patch: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ input, ctx }) => {
      return gatewayCall('gateway.config.patch', input.patch, ctx.gatewayToken)
    })
})

const sessionsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await gatewayCall('sessions_list', {}, ctx.gatewayToken)
      return { data: Array.isArray(result) ? result as Record<string, unknown>[] : [], connected: true }
    } catch {
      return { data: [] as Record<string, unknown>[], connected: false }
    }
  }),
  create: publicProcedure
    .input(z.object({ agentId: z.string(), channelId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return gatewayCall('sessions_create', input, ctx.gatewayToken)
    })
})

const agentsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await gatewayCall('agents_list', {}, ctx.gatewayToken)
      return { data: Array.isArray(result) ? result as Record<string, unknown>[] : [], connected: true }
    } catch {
      return { data: [] as Record<string, unknown>[], connected: false }
    }
  })
})

const toolsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await gatewayCall('tools_list', {}, ctx.gatewayToken)
      return { data: Array.isArray(result) ? result as Record<string, unknown>[] : [], connected: true }
    } catch {
      return { data: [] as Record<string, unknown>[], connected: false }
    }
  })
})

const providersRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await gatewayCall('providers_list', {}, ctx.gatewayToken)
      return { data: Array.isArray(result) ? result as Record<string, unknown>[] : [], connected: true }
    } catch {
      return { data: [] as Record<string, unknown>[], connected: false }
    }
  })
})

const cronsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await gatewayCall('crons_list', {}, ctx.gatewayToken)
      return { data: Array.isArray(result) ? result as Record<string, unknown>[] : [], connected: true }
    } catch {
      return { data: [] as Record<string, unknown>[], connected: false }
    }
  })
})

const channelsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await gatewayCall('channels_list', {}, ctx.gatewayToken)
      return { data: Array.isArray(result) ? result as Record<string, unknown>[] : [], connected: true }
    } catch {
      return { data: [] as Record<string, unknown>[], connected: false }
    }
  })
})

export const appRouter = router({
  // Gateway admin routers
  gateway: gatewayRouter,
  sessions: sessionsRouter,
  agents: agentsRouter,
  tools: toolsRouter,
  providers: providersRouter,
  crons: cronsRouter,
  channels: channelsRouter,
  evolution: evolutionRouter,
  // Dashboard routers (migrated from Next.js)
  tasks: tasksRouter,
  dashboardAgents: dashboardAgentsRouter,
  analytics: analyticsRouter,
  activity: activityRouter,
  calendar: calendarRouter,
  orchestration: orchestrationRouter,
  office: officeRouter,
  content: contentRouter,
  sdr: sdrRouter,
})

export type AppRouter = typeof appRouter
