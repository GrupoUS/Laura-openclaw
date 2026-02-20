import { Hono } from 'hono'
import { trpcServer } from '@hono/trpc-server'
import { appRouter } from './trpc'
import { serveStatic } from 'hono/bun'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

const app = new Hono()

// ── Auth Password (env or hardcoded fallback) ──
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '947685'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || ''

// ── Login endpoint ──
app.post('/api/login', async (c) => {
  const body = await c.req.json<{ password: string }>()

  if (body.password !== ADMIN_PASSWORD) {
    return c.json({ ok: false, error: 'Invalid password' }, 401)
  }

  // Set httpOnly cookie with the gateway token
  setCookie(c, 'gw_session', ADMIN_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })

  return c.json({ ok: true })
})

// ── Auth check endpoint ──
app.get('/api/auth/check', (c) => {
  const session = getCookie(c, 'gw_session')
  if (session === ADMIN_PASSWORD) {
    return c.json({ authenticated: true })
  }
  return c.json({ authenticated: false }, 401)
})

// ── Logout endpoint ──
app.post('/api/logout', (c) => {
  deleteCookie(c, 'gw_session', { path: '/' })
  return c.json({ ok: true })
})

// ── tRPC Provider ──
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: (_opts, c) => {
      // Read gateway token from cookie session, or from Authorization header
      const session = getCookie(c, 'gw_session')
      const headerToken = c.req.header('Authorization')?.replace('Bearer ', '')
      return {
        gatewayToken: headerToken || GATEWAY_TOKEN || session || ''
      }
    }
  })
)

// Health API (public, no auth)
app.get('/api/health', (c) => c.json({ ok: true }))

// Static Serving (Production build)
app.use('/*', serveStatic({ root: './dist/public' }))

const port = Number(process.env.PORT) || 3000

console.log(`🚀 OpenClaw Admin listening on port ${port}`)

export default Bun.serve({
  port,
  fetch: app.fetch,
})
