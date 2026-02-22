import { z } from 'zod'
import { router, publicProcedure } from '../trpc-init'
import { db } from '../db/client'
import { tasks } from '../db/schema'
import { and, gte, lte } from 'drizzle-orm'

export const calendarRouter = router({
  list: publicProcedure
    .input(z.object({
      start: z.string().optional(),
      end:   z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const whereConditions = []

      if (input?.start && input?.end) {
        const startDate = new Date(input.start)
        const endDate = new Date(input.end)
        whereConditions.push(
          and(gte(tasks.createdAt, startDate), lte(tasks.createdAt, endDate))
        )
      }

      const allTasks = await db.query.tasks.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        with: {
          subtasks: true
        },
        orderBy: (t, { asc }) => [asc(t.createdAt)]
      })

      return allTasks
    }),
})
