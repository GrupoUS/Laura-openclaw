import { initTRPC } from '@trpc/server'

// Create context types
export type Context = {
  gatewayToken: string
}

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
