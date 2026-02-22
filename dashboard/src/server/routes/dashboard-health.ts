/**
 * Dashboard health check endpoint
 */
import { Hono } from 'hono'
import { db } from '../db/client'
import { sql } from 'drizzle-orm'
import { eventBus } from '../events/emitter'

const dashboardHealth = new Hono()

dashboardHealth.get('/', async (c) => {
  let dbStatus = 'not_configured'

  try {
    await db.execute(sql`SELECT 1`)
    dbStatus = 'connected'
  } catch {
    dbStatus = process.env.DATABASE_URL ? 'disconnected' : 'not_configured'
  }

  let sseStatus = 'ready'
  let activeClients = 0
  try {
    activeClients = eventBus.getListenerCount()
  } catch {
    sseStatus = 'disabled'
  }

  return c.json({
    status: 'ok',
    service: 'laura-dashboard',
    db: dbStatus,
    sse: {
      activeClients,
      status: sseStatus,
    },
    ts: new Date().toISOString(),
  })
})

export { dashboardHealth }
