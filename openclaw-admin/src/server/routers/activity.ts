import { z } from 'zod'
import { router, publicProcedure } from '../trpc-init'
import { getRecentActivity } from '../db/queries'

export const activityRouter = router({
  list: publicProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(100).default(30),
    }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 30
      const events = await getRecentActivity(limit)
      return { data: events, count: events.length }
    }),
})
