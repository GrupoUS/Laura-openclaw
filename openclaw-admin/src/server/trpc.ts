import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'
import { gatewayCall } from './ws/openclaw'
import { evolutionRouter } from './routers/evolution'

// Create context types
export type Context = {
  gatewayToken: string
}

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

// Routers
const gatewayRouter = router({
  health: publicProcedure.query(async ({ ctx }) => {
    return gatewayCall('gateway.health', {}, ctx.gatewayToken)
  }),
  patch: publicProcedure
    .input(z.object({ patch: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ input, ctx }) => {
      return gatewayCall('gateway.config.patch', input.patch, ctx.gatewayToken)
    })
})

const sessionsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return gatewayCall('sessions_list', {}, ctx.gatewayToken)
  }),
  create: publicProcedure
    .input(z.object({ agentId: z.string(), channelId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return gatewayCall('sessions_create', input, ctx.gatewayToken)
    })
})

const agentsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return gatewayCall('agents_list', {}, ctx.gatewayToken)
  })
})

const toolsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return gatewayCall('tools_list', {}, ctx.gatewayToken).catch(() => [])
  })
})

const providersRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return gatewayCall('providers_list', {}, ctx.gatewayToken).catch(() => [])
  })
})

const cronsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return gatewayCall('crons_list', {}, ctx.gatewayToken).catch(() => [])
  })
})

const channelsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return gatewayCall('channels_list', {}, ctx.gatewayToken).catch(() => [])
  })
})

export const appRouter = router({
  gateway: gatewayRouter,
  sessions: sessionsRouter,
  agents: agentsRouter,
  tools: toolsRouter,
  providers: providersRouter,
  crons: cronsRouter,
  channels: channelsRouter,
  evolution: evolutionRouter,
})

export type AppRouter = typeof appRouter
