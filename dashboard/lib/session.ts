import type { SessionOptions } from 'iron-session'

const isBuildPhase = process.env.npm_lifecycle_event === 'build'

export interface SessionData {
  authenticated: boolean
  loginAt:       string   // ISO 8601
}

export const SESSION_OPTIONS: SessionOptions = {
  cookieName: 'laura-dashboard-session',
  password:    process.env.IRON_SESSION_PASSWORD || (isBuildPhase ? 'fallback_password_for_build_step_only_32_chars' : ''),
  cookieOptions: {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'lax',
    maxAge:    60 * 60 * 24,   // 24 horas
    path:      '/',
  },
}

// Guard — detecta config inválido no boot
if (!isBuildPhase && (!process.env.IRON_SESSION_PASSWORD || process.env.IRON_SESSION_PASSWORD.length < 32)) {
  throw new Error('[Session] IRON_SESSION_PASSWORD deve ter no mínimo 32 caracteres')
}
