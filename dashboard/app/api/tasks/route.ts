import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getTasks, createTask } from '@/lib/db/queries'

const createSchema = z.object({
  title:       z.string().min(3).max(200),
  description: z.string().optional(),
  phase:       z.number().int().min(1).default(1),
  priority:    z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  agent:       z.string().optional(),
})

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const tasks = await getTasks({
    status: (sp.get('status') as 'backlog' | 'in_progress' | 'done' | 'blocked') ?? undefined,
    agent:  sp.get('agent') ?? undefined,
    phase:  sp.get('phase') ? Number(sp.get('phase')) : undefined,
  })
  return Response.json({ data: tasks, count: tasks.length })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 422 },
    )
  }
  const task = await createTask(parsed.data)
  return Response.json({ data: task }, { status: 201 })
}
