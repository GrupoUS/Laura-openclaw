import { z } from 'zod'
import { router, publicProcedure } from '../trpc-init'
import { db } from '../db/client'
import { tasks } from '../db/schema'
import { and, gte, lte, or, eq } from 'drizzle-orm'

export const calendarRouter = router({
  list: publicProcedure
    .input(z.object({
      start:      z.string().optional(),
      end:        z.string().optional(),
      department: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const whereConditions = []

      if (input?.start && input?.end) {
        const startDate = new Date(input.start)
        const endDate = new Date(input.end)
        whereConditions.push(
          or(
            and(gte(tasks.dueDate, startDate), lte(tasks.dueDate, endDate)),
            and(gte(tasks.createdAt, startDate), lte(tasks.createdAt, endDate))
          )
        )
      }

      if (input?.department && input.department !== 'all') {
        whereConditions.push(eq(tasks.department, input.department as unknown as typeof tasks.department.enumValues[number]))
      }

      const allTasks = await db.query.tasks.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        with: {
          subtasks: true
        },
        orderBy: (t, { asc }) => [asc(t.dueDate)]
      })

      return allTasks
    }),
})
