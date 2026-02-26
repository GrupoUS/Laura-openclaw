import { z } from 'zod'
import { eq, asc } from 'drizzle-orm'
import { router, publicProcedure } from '../trpc-init'
import { db } from '../db/client'
import { contentCards } from '../db/schema'
import { eventBus } from '../events/emitter'

const STAGES = ['ideas', 'roteiro', 'thumbnail', 'gravacao', 'edicao', 'publicado'] as const
type Stage = typeof STAGES[number]

export const contentRouter = router({
  list: publicProcedure.query(async () => {
    const cards = await db.query.contentCards.findMany({
      orderBy: (t, { asc: a }) => [a(t.stage), a(t.position)],
    })

    const grouped = STAGES.reduce<Record<Stage, typeof cards>>((acc, stage) => {
      acc[stage] = cards.filter((c) => c.stage === stage)
      return acc
    }, {} as Record<Stage, typeof cards>)

    return grouped
  }),

  create: publicProcedure
    .input(z.object({
      title:       z.string().min(1),
      description: z.string().optional(),
      script:      z.string().optional(),
      stage:       z.enum(STAGES).default('ideas'),
      assignedTo:  z.string().optional(),
      tags:        z.array(z.string()).optional(),
      createdBy:   z.string().default('main'),
    }))
    .mutation(async ({ input }) => {
      const existing = await db.query.contentCards.findMany({
        where: eq(contentCards.stage, input.stage),
        orderBy: [asc(contentCards.position)],
      })
      const position = existing.length

      const [card] = await db.insert(contentCards).values({
        ...input,
        tags:     input.tags ?? [],
        position,
      }).returning()

      if (card) {
        eventBus.publish({
          type: 'content:card_created',
          taskId: card.id,
          payload: card as unknown as Record<string, unknown>,
          agent: input.createdBy ?? 'system',
          ts: new Date().toISOString(),
        })
      }

      return card
    }),

  update: publicProcedure
    .input(z.object({
      id:           z.number(),
      title:        z.string().min(1).optional(),
      description:  z.string().optional(),
      script:       z.string().optional(),
      stage:        z.enum(STAGES).optional(),
      assignedTo:   z.string().optional(),
      thumbnailUrl: z.string().optional(),
      videoUrl:     z.string().optional(),
      publishedUrl: z.string().optional(),
      tags:         z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...rest } = input
      const [updated] = await db.update(contentCards)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(contentCards.id, id))
        .returning()

      if (updated) {
        eventBus.publish({
          type: 'content:card_updated',
          taskId: updated.id,
          payload: updated as unknown as Record<string, unknown>,
          agent: 'system',
          ts: new Date().toISOString(),
        })
      }

      return updated
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(contentCards).where(eq(contentCards.id, input.id))
      return { success: true }
    }),

  reorder: publicProcedure
    .input(z.object({
      id:       z.number(),
      stage:    z.enum(STAGES),
      position: z.number(),
    }))
    .mutation(async ({ input }) => {
      const [updated] = await db.update(contentCards)
        .set({ stage: input.stage, position: input.position, updatedAt: new Date() })
        .where(eq(contentCards.id, input.id))
        .returning()
      return updated
    }),
})
