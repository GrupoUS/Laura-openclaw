import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { sealData, unsealData } from 'iron-session'
import { SESSION_OPTIONS, DEFAULT_PREFS, type UserPreferences, type SessionData } from '../session'

const preferencesRouter = new Hono()

const COOKIE_NAME = SESSION_OPTIONS.cookieName
const SEAL_PASSWORD = SESSION_OPTIONS.password as string

preferencesRouter.get('/', async (c) => {
  const sealed = getCookie(c, COOKIE_NAME)
  if (!sealed) return c.json({ data: DEFAULT_PREFS })
  try {
    const session = await unsealData<SessionData>(sealed, { password: SEAL_PASSWORD })
    return c.json({ data: session.preferences ?? DEFAULT_PREFS })
  } catch {
    return c.json({ data: DEFAULT_PREFS })
  }
})

preferencesRouter.patch('/', async (c) => {
  const sealed = getCookie(c, COOKIE_NAME)
  if (!sealed) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const session = await unsealData<SessionData>(sealed, { password: SEAL_PASSWORD })
    const body = await c.req.json<Partial<UserPreferences>>()
    
    session.preferences = {
      ...(session.preferences ?? DEFAULT_PREFS),
      ...body,
    }
    
    const newSealed = await sealData(session, { password: SEAL_PASSWORD })
    setCookie(c, COOKIE_NAME, newSealed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })
    
    return c.json({ data: session.preferences })
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

export { preferencesRouter }
