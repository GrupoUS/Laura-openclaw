/**
 * Content Pipeline API — REST endpoint for agents to create cards
 * Auth: x-laura-secret header
 * POST /api/laura/content/card — create a content card
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { contentCards } from '../db/schema'
import { eq, asc } from 'drizzle-orm'
import { eventBus } from '../events/emitter'

const content = new Hono()

// ── Auth middleware ────────────────────────────────────────────────
content.use('*', async (c, next) => {
  const secret = c.req.header('x-laura-secret')
  if (!secret || secret !== process.env.LAURA_API_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  return next()
})

const STAGES = ['ideas', 'roteiro', 'thumbnail', 'gravacao', 'edicao', 'publicado'] as const

const cardSchema = z.object({
  title:       z.string().min(1),
  description: z.string().optional(),
  script:      z.string().optional(),
  stage:       z.enum(STAGES).default('ideas'),
  assignedTo:  z.string().optional(),
  tags:        z.array(z.string()).optional(),
  createdBy:   z.string().optional(),
})

// ── POST /card ─────────────────────────────────────────────────────
content.post('/card', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = cardSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid payload', issues: parsed.error.issues }, 422)
  }
  const input = parsed.data

  // Determine position (append to end of stage)
  const existing = await db.query.contentCards.findMany({
    where: eq(contentCards.stage, input.stage),
    orderBy: [asc(contentCards.position)],
  })
  const position = existing.length

  const [card] = await db.insert(contentCards).values({
    title:       input.title,
    description: input.description,
    script:      input.script,
    stage:       input.stage,
    assignedTo:  input.assignedTo,
    tags:        input.tags ?? [],
    createdBy:   input.createdBy ?? 'agent',
    position,
  }).returning()

  if (card) {
    eventBus.publish({
      type: 'content:card_created',
      taskId: card.id,
      payload: card as unknown as Record<string, unknown>,
      agent: input.createdBy ?? 'agent',
      ts: new Date().toISOString(),
    })
  }

  return c.json({ ok: true, id: card?.id, card }, 201)
})

export { content as contentApiRoutes }
