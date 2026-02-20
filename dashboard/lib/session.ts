import type { SessionOptions } from 'iron-session'

export interface SessionData {
  authenticated: boolean
  loginAt:       string   // ISO 8601
}

export const SESSION_OPTIONS: SessionOptions = {
  cookieName: 'laura-dashboard-session',
  password:    process.env.IRON_SESSION_PASSWORD as string,
  cookieOptions: {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'lax',
    maxAge:    60 * 60 * 24,   // 24 horas
    path:      '/',
  },
}

// Guard — detecta config inválido no boot
if (!process.env.IRON_SESSION_PASSWORD || process.env.IRON_SESSION_PASSWORD.length < 32) {
  throw new Error('[Session] IRON_SESSION_PASSWORD deve ter no mínimo 32 caracteres')
}
