import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SESSION_OPTIONS, type SessionData } from '@/lib/session'

export async function POST() {
  const session = await getIronSession<SessionData>(
    await cookies(), SESSION_OPTIONS
  )
  session.destroy()
  return Response.json({ ok: true })
}
