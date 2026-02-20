import { NextRequest } from 'next/server'
import { z } from 'zod'
import { updateSubtask } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

const schema = z.object({
  status: z.enum(['todo', 'doing', 'done', 'blocked']),
})

type Params = { params: Promise<{ id: string; sid: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { sid } = await params
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 422 },
    )
  }
  const subtask = await updateSubtask(sid, parsed.data.status)
  if (!subtask) {
    return Response.json(
      { error: 'Not found or race condition — subtask already claimed by another agent' },
      { status: 409 },
    )
  }
  return Response.json({ data: subtask })
}
