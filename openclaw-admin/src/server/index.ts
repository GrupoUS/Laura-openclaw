/**
 * OpenClaw Admin + Dashboard Server
 *
 * Dashboard is the PRIMARY application — auth via iron-session
 * Gateway admin is secondary — coexists under /api/admin/*
 */
import { Hono } from 'hono'
import { trpcServer } from '@hono/trpc-server'
import { appRouter } from './trpc'
import { serveStatic } from 'hono/bun'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { runEvolutionCycle } from './services/evolution'
import { dashboardAuth } from './routes/dashboard-auth'
import { sseRoutes } from './routes/events'

const app = new Hono()

// ── Gateway admin credentials (secondary, for /api/admin routes) ──
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '947685'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || ''

// ────────────────────────────────────────────────────────────────────
// PRIMARY AUTH: Dashboard (iron-session)
// ────────────────────────────────────────────────────────────────────
app.route('/api/auth', dashboardAuth)

// ────────────────────────────────────────────────────────────────────
// SSE + Health (public paths with their own auth)
// ────────────────────────────────────────────────────────────────────
app.route('/api/events', sseRoutes)
app.get('/api/health', async (c) => {
  // Merged health: basic + dashboard
  const { db } = await import('./db/client')
  const { sql } = await import('drizzle-orm')
  let dbStatus = 'not_configured'
  try {
    await db.execute(sql`SELECT 1`)
    dbStatus = 'connected'
  } catch {
    dbStatus = process.env.DATABASE_URL ? 'disconnected' : 'not_configured'
  }
  return c.json({
    status: 'ok',
    service: 'laura-dashboard',
    db: dbStatus,
    ts: new Date().toISOString(),
  })
})

// ────────────────────────────────────────────────────────────────────
// SECONDARY: Gateway Admin endpoints (under /api/admin/*)
// ────────────────────────────────────────────────────────────────────
app.post('/api/admin/login', async (c) => {
  const body = await c.req.json<{ password: string }>()
  if (body.password !== ADMIN_PASSWORD) {
    return c.json({ ok: false, error: 'Invalid password' }, 401)
  }
  setCookie(c, 'gw_session', ADMIN_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return c.json({ ok: true })
})

app.get('/api/admin/auth/check', (c) => {
  const session = getCookie(c, 'gw_session')
  if (session === ADMIN_PASSWORD) {
    return c.json({ authenticated: true })
  }
  return c.json({ authenticated: false }, 401)
})

app.post('/api/admin/logout', (c) => {
  deleteCookie(c, 'gw_session', { path: '/' })
  return c.json({ ok: true })
})

// Evolution cron trigger
app.post('/api/evolution/trigger', async (c) => {
  try {
    const body = await c.req.json<{ trigger?: string }>().catch(() => ({ trigger: undefined }))
    const trigger = (body.trigger || 'cron') as 'cron' | 'heartbeat' | 'manual' | 'mad_dog'
    const result = await runEvolutionCycle(trigger)
    return c.json(result)
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500)
  }
})

// ────────────────────────────────────────────────────────────────────
// tRPC — shared by both dashboard and gateway admin
// ────────────────────────────────────────────────────────────────────
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: (_opts, c) => {
      const session = getCookie(c, 'gw_session')
      const headerToken = c.req.header('Authorization')?.replace('Bearer ', '')
      return {
        gatewayToken: headerToken || GATEWAY_TOKEN || session || ''
      }
    }
  })
)

// ── Static Serving (Production SPA) ──
app.use('/*', serveStatic({ root: './dist/public' }))

// SPA fallback: serve index.html for all non-API, non-asset routes
app.get('*', serveStatic({ root: './dist/public', path: 'index.html' }))

const port = Number(process.env.PORT) || 3000

console.log(`🚀 Laura Dashboard listening on port ${port}`)

export default Bun.serve({
  port,
  hostname: '0.0.0.0',
  fetch: app.fetch,
})
