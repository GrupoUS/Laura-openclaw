import { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SESSION_OPTIONS, type SessionData } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password: string }

  if (!password || password !== process.env.DASHBOARD_PASSWORD) {
    // Delay artificial para mitigar brute-force
    await new Promise(r => setTimeout(r, 500))
    return Response.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const session = await getIronSession<SessionData>(
    await cookies(), SESSION_OPTIONS
  )
  session.authenticated = true
  session.loginAt       = new Date().toISOString()
  await session.save()

  return Response.json({ ok: true })
}
