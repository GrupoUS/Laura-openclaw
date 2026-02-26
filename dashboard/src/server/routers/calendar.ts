import { z } from 'zod'
import { router, publicProcedure } from '../trpc-init'
import { db } from '../db/client'
import { tasks } from '../db/schema'
import { and, gte, lte } from 'drizzle-orm'
import { gatewayCall } from '../ws/openclaw'
import { CronExpressionParser } from 'cron-parser'

function parseCronDaysOfWeek(schedule: string): number[] {
  try {
    const expr = CronExpressionParser.parse(schedule)
    const dowField = expr.fields.dayOfWeek
    if (dowField.isWildcard) return [0, 1, 2, 3, 4, 5, 6]
    const days = [...new Set([...dowField.values].map((d) => (d as number) % 7))]
    return days.length >= 7 ? [0, 1, 2, 3, 4, 5, 6] : days
  } catch {
    return [0, 1, 2, 3, 4, 5, 6]
  }
}

function isFrequentCron(schedule: string): boolean {
  const parts = schedule.trim().split(/\s+/)
  if (parts.length < 2) return false
  const minutePart = parts[0]
  if (minutePart.startsWith('*/')) {
    const interval = parseInt(minutePart.slice(2), 10)
    return !isNaN(interval) && interval < 60
  }
  return false
}

function getNextRun(schedule: string): Date | null {
  try {
    const expr = CronExpressionParser.parse(schedule)
    return expr.next().toDate()
  } catch {
    return null
  }
}

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

  unified: publicProcedure.query(async ({ ctx }) => {
    // Tasks from NeonDB
    const allTasks = await db.query.tasks.findMany({
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    })

    // Cron jobs from gateway
    let cronJobs: Record<string, unknown>[] = []
    try {
      const result = await gatewayCall<unknown>('crons_list', {}, ctx.gatewayToken)
      cronJobs = Array.isArray(result) ? (result as Record<string, unknown>[]) : []
    } catch {
      // Gateway offline
    }

    // Enrich crons with parsed schedule info
    const enrichedCrons = cronJobs.map((cron) => {
      const schedule = (cron.schedule as string | undefined) ?? ''
      const daysOfWeek = parseCronDaysOfWeek(schedule)
      const frequent = isFrequentCron(schedule)
      const nextRun = getNextRun(schedule)
      const cronId = cron.id as string

      return {
        id: cronId,
        name: (cron.name as string | undefined) ?? cronId,
        schedule,
        enabled: cron.active !== false,
        daysOfWeek,
        frequent,
        nextRun: nextRun?.toISOString() ?? null,
        lastRun: (cron.lastRun as string | undefined) ?? null,
        action: (cron.action as string | undefined) ?? null,
      }
    })

    // "Always running" = crons that run multiple times per day
    const alwaysRunning = enrichedCrons.filter((c) => c.frequent)

    // Scheduled = crons that run on specific days
    const scheduled = enrichedCrons.filter((c) => !c.frequent)

    // Next up = sort by nextRun ascending, take top 10
    const nextUp = enrichedCrons
      .filter((c): c is typeof c & { nextRun: string } => c.nextRun !== null)
      .toSorted((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime())
      .slice(0, 10)

    return {
      tasks:         allTasks,
      crons:         enrichedCrons,
      alwaysRunning,
      scheduled,
      nextUp,
    }
  }),
})
