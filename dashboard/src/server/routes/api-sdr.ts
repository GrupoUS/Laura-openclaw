/**
 * SDR API — Real-time sync endpoints for Laura SDR agent
 * Auth: x-laura-secret header (same as /api/tasks)
 * All routes publish SSE events via eventBus
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { lauraMemories } from '../db/schema'
import { neon } from '@neondatabase/serverless'
import { eventBus } from '../events/emitter'

const rawSql = neon(process.env.DATABASE_URL ?? '')

const sdr = new Hono()

// ── Auth middleware ────────────────────────────────────────────────
sdr.use('*', async (c, next) => {
  const secret = c.req.header('x-laura-secret')
  if (!secret || secret !== process.env.LAURA_API_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  return next()
})

// ── Schemas ────────────────────────────────────────────────────────
const leadContactSchema = z.object({
  phone:   z.string().min(1),
  name:    z.string().optional(),
  product: z.string().optional(),
  message: z.string().optional(),
})

const handoffSchema = z.object({
  phone:       z.string().min(1),
  name:        z.string().optional(),
  product:     z.string().optional(),
  closerPhone: z.string().min(1),
  closerName:  z.string().min(1),
  notes:       z.string().optional(),
})

const objectionSchema = z.object({
  phone:      z.string().min(1),
  objection:  z.string().min(1),
  resolution: z.string().optional(),
})

const genericEventSchema = z.object({
  type:    z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
})

// ── POST /sdr/lead-contact ─────────────────────────────────────────
sdr.post('/lead-contact', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = leadContactSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid payload', issues: parsed.error.issues }, 422)
  }
  const { phone, name, product, message } = parsed.data

  const [row] = await db.insert(lauraMemories).values({
    content: message ?? `Lead contact: ${phone}`,
    metadata: { type: 'lead_interaction', lead: phone, name, product },
  }).returning()

  eventBus.publish({
    type: 'lead_contacted',
    taskId: row?.id ?? 0,
    payload: { phone, name, product, message, memoryId: row?.id },
    agent: 'laura',
    ts: new Date().toISOString(),
  })

  return c.json({ ok: true, id: row?.id }, 201)
})

// ── POST /sdr/handoff ──────────────────────────────────────────────
sdr.post('/handoff', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = handoffSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid payload', issues: parsed.error.issues }, 422)
  }
  const { phone, name, product, closerPhone, closerName, notes } = parsed.data

  // Use raw SQL to match actual DB schema (phone, name, context, notes, status)
  const context = [closerPhone, closerName].filter(Boolean).join(' | ')
  const rows = await rawSql`
    INSERT INTO lead_handoffs (phone, name, product, context, notes, status)
    VALUES (${phone}, ${name ?? null}, ${product ?? null}, ${context}, ${notes ?? null}, 'pending')
    RETURNING id
  `
  const handoffId = (rows[0]?.id as number) ?? 0

  eventBus.publish({
    type: 'lead_handoff',
    taskId: handoffId,
    payload: { phone, name, product, closerPhone, closerName, notes, handoffId },
    agent: 'laura',
    ts: new Date().toISOString(),
  })

  return c.json({ ok: true, id: handoffId }, 201)
})

// ── POST /sdr/objection ────────────────────────────────────────────
sdr.post('/objection', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = objectionSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid payload', issues: parsed.error.issues }, 422)
  }
  const { phone, objection, resolution } = parsed.data

  const [row] = await db.insert(lauraMemories).values({
    content: `Objection handled for ${phone}: ${objection}`,
    metadata: { type: 'sdr_action', objection, action: 'objection_handled', lead: phone, resolution },
  }).returning()

  eventBus.publish({
    type: 'objection_handled',
    taskId: row?.id ?? 0,
    payload: { phone, objection, resolution, memoryId: row?.id },
    agent: 'laura',
    ts: new Date().toISOString(),
  })

  return c.json({ ok: true, id: row?.id }, 201)
})

// ── POST /sdr/event ────────────────────────────────────────────────
sdr.post('/event', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = genericEventSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid payload', issues: parsed.error.issues }, 422)
  }
  const { type, payload } = parsed.data

  eventBus.publish({
    type: 'sdr_generic',
    taskId: 0,
    payload: { sdrType: type, ...payload },
    agent: 'laura',
    ts: new Date().toISOString(),
  })

  return c.json({ ok: true })
})

// ── POST /sdr/agent-status — publish agent working/idle status ─────
const agentStatusSchema = z.object({
  agentId:       z.string().min(1),
  status:        z.enum(['active', 'standby', 'idle']),
  currentAction: z.string().optional(),
})

sdr.post('/agent-status', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = agentStatusSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid payload', issues: parsed.error.issues }, 422)
  }
  const { agentId, status, currentAction } = parsed.data

  eventBus.publish({
    type: 'agent:status',
    taskId: 0,
    payload: { agentId, status, currentAction: currentAction ?? '' },
    agent: agentId,
    ts: new Date().toISOString(),
  })

  return c.json({ ok: true })
})

export { sdr as sdrApiRoutes }
