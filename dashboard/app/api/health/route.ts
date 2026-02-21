import { getDb } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { eventBus } from '@/lib/events/emitter'

export const dynamic = 'force-dynamic'

export async function GET() {
  let dbStatus = 'not_configured'

  try {
    const db = getDb()
    await db.execute(sql`SELECT 1`)
    dbStatus = 'connected'
  } catch {
    dbStatus = (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL) ? 'disconnected' : 'not_configured'
  }

    let sseStatus = 'ready'
    let activeClients = 0
    try {
      activeClients = eventBus.getListenerCount()
    } catch {
      sseStatus = 'disabled'
    }

  // Always return 200 — Railway healthcheck needs process liveness,
  // not DB readiness. DB status is informational only.
  return Response.json({
    status: 'ok',
    service: 'laura-dashboard',
    db: dbStatus,
    sse: {
      activeClients,
      status: sseStatus,
    },
    ts: new Date().toISOString(),
  })
}
