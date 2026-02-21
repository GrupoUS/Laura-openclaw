/**
 * Dashboard Auth Middleware for Hono
 * Ports Next.js middleware.ts dual-auth logic:
 *   Layer 1: iron-session cookie (browsers)
 *   Layer 2: x-laura-secret header (OpenClaw agents)
 */
import { createMiddleware } from 'hono/factory'
import { unsealData } from 'iron-session'
import { SESSION_OPTIONS, type SessionData } from '@/server/session'

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/api/dashboard/auth',
  '/api/dashboard/health',
  '/api/dashboard/events',  // SSE — auth via query param
  '/api/health',
  '/api/login',
  '/api/logout',
  '/api/auth/check',
]

const API_PATTERN = /^\/api\//
const TRPC_PATTERN = /^\/trpc\//

export const dashboardAuthMiddleware = createMiddleware(async (c, next) => {
  const pathname = new URL(c.req.url).pathname

  // Public paths pass through
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return next()
  }

  // tRPC routes — auth handled in tRPC context
  if (TRPC_PATTERN.test(pathname)) {
    return next()
  }

  // ─── Check iron-session cookie ────────────────────────────────────────
  const cookieName = 'laura-dashboard-session'
  const cookieValue = c.req.header('cookie')
    ?.split(';')
    .find(ck => ck.trim().startsWith(`${cookieName}=`))
    ?.split('=')[1]
    ?.trim()

  if (cookieValue) {
    try {
      const session = await unsealData<SessionData>(cookieValue, {
        password: SESSION_OPTIONS.password,
      })
      if (session.authenticated) {
        return next()
      }
    } catch {
      // Invalid or expired cookie — continue to header check
    }
  }

  // ─── Fallback: x-laura-secret (OpenClaw agents) ───────────────────────
  if (API_PATTERN.test(pathname) || TRPC_PATTERN.test(pathname)) {
    const agentSecret = c.req.header('x-laura-secret')
    if (agentSecret && agentSecret === process.env.LAURA_API_SECRET) {
      return next()
    }
  }

  // ─── Not authenticated ───────────────────────────────────────────────
  if (API_PATTERN.test(pathname)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Browser → serve the SPA (login redirect handled client-side)
  return next()
})
