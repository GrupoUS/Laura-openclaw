import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getTaskById, updateTask } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  status:   z.enum(['backlog', 'in_progress', 'done', 'blocked']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  agent:    z.string().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const task = await getTaskById(id)
  if (!task) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ data: task })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 422 },
    )
  }
  const task = await updateTask(id, parsed.data)
  if (!task) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ data: task })
}
