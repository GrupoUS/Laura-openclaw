/**
 * Dashboard auth routes (login/logout) using iron-session
 */
import { Hono } from 'hono'
import { getIronSession } from 'iron-session'
import { SESSION_OPTIONS, type SessionData } from '@/server/session'

const dashboardAuth = new Hono()

// POST /api/dashboard/auth/login
dashboardAuth.post('/login', async (c) => {
  const { password } = await c.req.json<{ password: string }>()

  if (!password || password !== process.env.DASHBOARD_PASSWORD) {
    // Artificial delay to mitigate brute-force
    await new Promise(r => setTimeout(r, 500))
    return c.json({ error: 'Senha incorreta' }, 401)
  }

  const session = await getIronSession<SessionData>(c.req.raw, c.res as unknown as Response, SESSION_OPTIONS)
  session.authenticated = true
  session.loginAt       = new Date().toISOString()
  await session.save()

  return c.json({ ok: true })
})

// POST /api/dashboard/auth/logout
dashboardAuth.post('/logout', async (c) => {
  const session = await getIronSession<SessionData>(c.req.raw, c.res as unknown as Response, SESSION_OPTIONS)
  session.destroy()
  return c.json({ ok: true })
})

// GET /api/dashboard/auth/check
dashboardAuth.get('/check', async (c) => {
  const cookieName = 'laura-dashboard-session'
  const cookieValue = c.req.header('cookie')
    ?.split(';')
    .find(ck => ck.trim().startsWith(`${cookieName}=`))
    ?.split('=')[1]
    ?.trim()

  if (!cookieValue) {
    return c.json({ authenticated: false }, 401)
  }

  try {
    const { unsealData } = await import('iron-session')
    const session = await unsealData<SessionData>(cookieValue, {
      password: SESSION_OPTIONS.password,
    })
    if (session.authenticated) {
      return c.json({ authenticated: true })
    }
  } catch {
    // Invalid cookie
  }

  return c.json({ authenticated: false }, 401)
})

export { dashboardAuth }
