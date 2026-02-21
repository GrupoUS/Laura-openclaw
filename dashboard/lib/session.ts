import type { SessionOptions } from 'iron-session'

const isBuildPhase = process.env.npm_lifecycle_event === 'build'

const defaultFallback = 'fallback_password_for_build_step_only_32_chars'
const rawPassword = process.env.IRON_SESSION_PASSWORD || ''
const finalPassword = rawPassword.length >= 32 ? rawPassword : defaultFallback

export interface SessionData {
  authenticated: boolean
  loginAt:       string   // ISO 8601
}

export const SESSION_OPTIONS: SessionOptions = {
  cookieName: 'laura-dashboard-session',
  password:    finalPassword,
  cookieOptions: {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'lax',
    maxAge:    60 * 60 * 24,   // 24 horas
    path:      '/',
  },
}

if (!isBuildPhase && rawPassword.length < 32) {
  console.error('################################################################')
  console.error('# ⚠️  WARNING: IRON_SESSION_PASSWORD is not set or < 32 chars  #')
  console.error('# ⚠️  Using insecure fallback. Please set it in your env!      #')
  console.error('################################################################')
}
