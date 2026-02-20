import { NextRequest, NextResponse } from 'next/server'
import { unsealData } from 'iron-session'
import type { SessionData } from '@/lib/session'

// Rotas que NÃO precisam de autenticação
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/health',
]

// Rotas de API que aceitam x-laura-secret como alternativa ao cookie
// (para agentes OpenClaw que não têm cookie)
const AGENT_API_PATTERN = /^\/api\//

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Deixar rotas públicas passarem sem verificação
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // SSE endpoint — autenticado via query param (Milestone B), não cookie
  if (pathname === '/api/events') {
    return NextResponse.next()
  }

  // ─── Verificar cookie de sessão ────────────────────────────────────────
  const cookieName = 'laura-dashboard-session'
  const cookieValue = req.cookies.get(cookieName)?.value

  if (cookieValue) {
    try {
      const session = await unsealData<SessionData>(cookieValue, {
        password: process.env.IRON_SESSION_PASSWORD!,
      })
      if (session.authenticated) {
        return NextResponse.next()
      }
    } catch {
      // Cookie inválido ou expirado — continuar para checar header
    }
  }

  // ─── Fallback: x-laura-secret (agentes OpenClaw) ───────────────────────
  if (AGENT_API_PATTERN.test(pathname)) {
    const agentSecret = req.headers.get('x-laura-secret')
    if (agentSecret && agentSecret === process.env.LAURA_API_SECRET) {
      return NextResponse.next()
    }
  }

  // ─── Não autenticado ───────────────────────────────────────────────────
  // API → 401 JSON
  if (AGENT_API_PATTERN.test(pathname)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Browser → redirect para /login com callbackUrl
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  // Aplica middleware em TODAS as rotas exceto arquivos estáticos
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
