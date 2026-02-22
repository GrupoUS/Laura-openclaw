/**
 * Dashboard auth routes (login/logout/check) using iron-session sealData/unsealData
 * Compatible with Hono — does NOT rely on getIronSession(req, res)
 */
import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { sealData, unsealData } from 'iron-session'
import { SESSION_OPTIONS, type SessionData } from '@/server/session'

const dashboardAuth = new Hono()

const COOKIE_NAME = SESSION_OPTIONS.cookieName
const SEAL_PASSWORD = SESSION_OPTIONS.password

if (!process.env.DASHBOARD_PASSWORD) {
  console.error('################################################################')
  console.error('# ⚠️  DASHBOARD_PASSWORD env var is NOT SET — login will FAIL  #')
  console.error('################################################################')
}

// POST /api/auth/login
dashboardAuth.post('/login', async (c) => {
  const { password } = await c.req.json<{ password: string }>()

  if (!password || password !== process.env.DASHBOARD_PASSWORD) {
    await new Promise(r => setTimeout(r, 500))
    return c.json({ ok: false, error: 'Senha incorreta' }, 401)
  }

  const sessionData: SessionData = {
    authenticated: true,
    loginAt: new Date().toISOString(),
  }

  const sealed = await sealData(sessionData, { password: SEAL_PASSWORD })

  setCookie(c, COOKIE_NAME, sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24, // 24h
    path: '/',
  })

  return c.json({ ok: true })
})

// POST /api/auth/logout
dashboardAuth.post('/logout', async (c) => {
  deleteCookie(c, COOKIE_NAME, { path: '/' })
  return c.json({ ok: true })
})

// GET /api/auth/check
dashboardAuth.get('/check', async (c) => {
  const sealed = getCookie(c, COOKIE_NAME)

  if (!sealed) {
    return c.json({ authenticated: false }, 401)
  }

  try {
    const session = await unsealData<SessionData>(sealed, {
      password: SEAL_PASSWORD,
    })
    if (session.authenticated) {
      return c.json({ authenticated: true })
    }
  } catch {
    // Invalid or expired cookie
  }

  return c.json({ authenticated: false }, 401)
})

export { dashboardAuth }
