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
import { sealData, unsealData } from 'iron-session'
import { SESSION_OPTIONS } from './session'
import { runEvolutionCycle } from './services/evolution'
import { checkRateLimit } from './middleware/rate-limit'
import { dashboardAuth } from './routes/dashboard-auth'
import { preferencesRouter } from './routes/preferences'
import { sseRoutes } from './routes/events'
import { apiTasksRoutes } from './routes/api-tasks'
import { sdrApiRoutes } from './routes/api-sdr'

import { secureHeaders } from 'hono/secure-headers'
import { etag } from 'hono/etag'

const app = new Hono()

// NOTE: hono/compress removed — uses Node.js zlib internally, crashes on Bun runtime.
// Railway proxy handles gzip at the edge layer.

// ── ETag for conditional requests (skip dynamic API/tRPC routes) ──
app.use('/assets/*', etag())
app.use('/*.js', etag())
app.use('/*.css', etag())

// ── Immutable cache for hashed static assets ──
app.use('/assets/*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'public, max-age=31536000, immutable')
})

app.use('*', secureHeaders({
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  crossOriginOpenerPolicy: 'same-origin',
}))

// ── Gateway admin credentials (secondary, for /api/admin routes) ──
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
if (!ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
  throw new Error('ADMIN_PASSWORD is required in production')
}
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN
if (!GATEWAY_TOKEN && process.env.NODE_ENV === 'production') {
  throw new Error('GATEWAY_TOKEN is required in production')
}

// ────────────────────────────────────────────────────────────────────
// PRIMARY AUTH: Dashboard (iron-session)
// ────────────────────────────────────────────────────────────────────
app.route('/api/auth', dashboardAuth)
app.route('/api/preferences', preferencesRouter)

// ────────────────────────────────────────────────────────────────────
// SSE + Health (public paths with their own auth)
// ────────────────────────────────────────────────────────────────────
app.route('/api/events', sseRoutes)

// Health check MUST be registered before apiTasksRoutes (which has auth middleware on /api/*)
app.get('/api/health', async (c) => {
  let dbStatus = 'not_configured'
  try {
    if (process.env.DATABASE_URL) {
      const { db } = await import('./db/client')
      const { sql } = await import('drizzle-orm')
      await db.execute(sql`SELECT 1`)
      dbStatus = 'connected'
    }
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

// REST API for agents (auth via x-laura-secret header)
// Mounted at /api/tasks to avoid wildcard middleware intercepting /api/health
app.route('/api/tasks', apiTasksRoutes)

// SDR real-time sync endpoints for Laura agent
app.route('/api/laura/sdr', sdrApiRoutes)

// ────────────────────────────────────────────────────────────────────
// SECONDARY: Gateway Admin endpoints (under /api/admin/*)
// ────────────────────────────────────────────────────────────────────
app.post('/api/admin/login', async (c) => {
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
  if (!checkRateLimit(ip)) {
    return c.json({ ok: false, error: 'Too many attempts. Try again in 1 minute.' }, 429)
  }
  const body = await c.req.json<{ password: string }>()
  if (!ADMIN_PASSWORD || body.password !== ADMIN_PASSWORD) {
    return c.json({ ok: false, error: 'Invalid password' }, 401)
  }
  const sealed = await sealData(
    { authenticated: true, role: 'admin', loginAt: new Date().toISOString() },
    { password: SESSION_OPTIONS.password }
  )
  setCookie(c, 'gw_session', sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return c.json({ ok: true })
})

app.get('/api/admin/auth/check', async (c) => {
  const sealed = getCookie(c, 'gw_session')
  if (!sealed) return c.json({ authenticated: false }, 401)
  try {
    const session = await unsealData<{ authenticated: boolean }>(sealed, {
      password: SESSION_OPTIONS.password,
    })
    if (session.authenticated) return c.json({ authenticated: true })
  } catch { /* expired/invalid */ }
  return c.json({ authenticated: false }, 401)
})

app.post('/api/admin/logout', (c) => {
  deleteCookie(c, 'gw_session', { path: '/' })
  return c.json({ ok: true })
})

// Evolution cron trigger (auth via x-laura-secret header)
app.post('/api/evolution/trigger', async (c) => {
  const secret = c.req.header('x-laura-secret')
  const validSecret = process.env.LAURA_API_SECRET
  if (validSecret && (!secret || secret !== validSecret)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
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
    createContext: async (_opts, c) => {
      const headerToken = c.req.header('Authorization')?.replace('Bearer ', '')
      let gatewayToken = headerToken || GATEWAY_TOKEN || ''
      if (!gatewayToken) {
        const sealed = getCookie(c, 'gw_session')
        if (sealed) {
          try {
            const session = await unsealData<{ authenticated: boolean }>(sealed, {
              password: SESSION_OPTIONS.password,
            })
            if (session.authenticated) gatewayToken = GATEWAY_TOKEN || ''
          } catch { /* ignore */ }
        }
      }
      return { gatewayToken }
    }
  })
)

// ── Static Serving (Production SPA) ──
app.use('/*', serveStatic({ root: './dist/public' }))

// SPA fallback: serve index.html for all non-API, non-asset routes
app.get('*', serveStatic({ root: './dist/public', path: 'index.html' }))

const port = Number(process.env.PORT) || 3000

// Validate DB connection at startup
if (process.env.DATABASE_URL) {
  import('./db/client').then(async ({ db }) => {
    const { sql } = await import('drizzle-orm')
    try {
      await db.execute(sql`SELECT 1`)
      console.log('[boot] DB connected') // eslint-disable-line no-console -- startup log
    } catch (err) {
      console.error('[boot] DB connection failed:', (err as Error).message) // eslint-disable-line no-console -- startup log
      if (process.env.NODE_ENV === 'production') process.exit(1)
    }
  })
}

// Eagerly start gateway WS at boot so it's ready before first client poll
import('./ws/openclaw').then(({ getGatewayWs }) => {
  try { getGatewayWs() } catch { /* will retry via reconnect logic */ }
}).catch(() => { /* module load failure — gateway features degraded */ })

// eslint-disable-next-line no-console -- startup log is intentional
console.log(`Laura Dashboard listening on port ${port}`)

export default Bun.serve({
  port,
  hostname: '0.0.0.0',
  fetch: app.fetch,
})
