import type { SessionOptions } from 'iron-session'

const rawPassword = process.env.IRON_SESSION_PASSWORD ?? ''
if (rawPassword.length < 32 && process.env.NODE_ENV === 'production') {
  throw new Error('IRON_SESSION_PASSWORD must be >= 32 chars in production')
}
const defaultFallback = 'fallback_password_for_build_step_only_32_chars'
const finalPassword = rawPassword.length >= 32 ? rawPassword : defaultFallback

export interface UserPreferences {
  defaultView:      'board' | 'agents'
  sidebarCollapsed: boolean
  compactMode:      boolean
}

export const DEFAULT_PREFS: UserPreferences = {
  defaultView:      'board',
  sidebarCollapsed: false,
  compactMode:      false,
}

export interface SessionData {
  authenticated: boolean
  loginAt:       string   // ISO 8601
  preferences?:  UserPreferences
}

export const SESSION_OPTIONS: SessionOptions = {
  cookieName: 'laura-dashboard-session',
  password:    finalPassword,
  cookieOptions: {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'lax',
    maxAge:    60 * 60 * 24,   // 24 hours
    path:      '/',
  },
}

if (rawPassword.length < 32) {
  // eslint-disable-next-line no-console -- startup security warning is intentional
  console.error('[session] ⚠️  IRON_SESSION_PASSWORD is not set or < 32 chars. Using insecure fallback!')
}
