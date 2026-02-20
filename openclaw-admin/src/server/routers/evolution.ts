import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import {
  storeMemory,
  recall,
  listMemories,
  deleteMemory,
  getMemoryStats,
} from '../services/memory'
import { runEvolutionCycle, getEvolutionStats } from '../services/evolution'

// ── Memory Router ──

const memoriesRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          category: z
            .enum(['lesson', 'pattern', 'correction', 'decision', 'preference', 'gotcha'])
            .optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return listMemories(input)
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        category: z
          .enum(['lesson', 'pattern', 'correction', 'decision', 'preference', 'gotcha'])
          .optional(),
        threshold: z.number().min(0).max(1).default(0.5),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      return recall(input)
    }),

  store: publicProcedure
    .input(
      z.object({
        content: z.string().min(1),
        category: z.enum([
          'lesson',
          'pattern',
          'correction',
          'decision',
          'preference',
          'gotcha',
        ]),
        source: z.string().min(1),
        metadata: z.record(z.string(), z.unknown()).optional(),
        score: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await storeMemory(input)
      return { id }
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const deleted = await deleteMemory(input.id)
      return { deleted }
    }),

  stats: publicProcedure.query(async () => {
    return getMemoryStats()
  }),
})

// ── Cycles Router ──

const cyclesRouter = router({
  list: publicProcedure.query(async () => {
    const stats = await getEvolutionStats()
    return stats.cycles.recent
  }),

  trigger: publicProcedure
    .input(
      z
        .object({
          trigger: z
            .enum(['cron', 'heartbeat', 'manual', 'mad_dog'])
            .default('manual'),
        })
        .optional()
    )
    .mutation(async ({ input }) => {
      const trigger = input?.trigger ?? 'manual'
      return runEvolutionCycle(trigger)
    }),
})

// ── Combined Evolution Router ──

export const evolutionRouter = router({
  memories: memoriesRouter,
  cycles: cyclesRouter,
  stats: publicProcedure.query(async () => {
    return getEvolutionStats()
  }),
})
