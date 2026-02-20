import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSubtask } from '@/lib/db/queries'
import { eventBus } from '@/lib/events/emitter'

export const dynamic = 'force-dynamic'

const schema = z.object({
  title: z.string().min(3).max(300),
  phase: z.number().int().min(1).default(1),
  agent: z.string().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 422 },
    )
  }
  const subtask = await createSubtask({ ...parsed.data, taskId: id })

  eventBus.publish({
    type: 'subtask:created',
    taskId: id,
    payload: subtask as unknown as Record<string, unknown>,
    agent: parsed.data.agent,
    ts: new Date().toISOString(),
  })

  return Response.json({ data: subtask }, { status: 201 })
}

