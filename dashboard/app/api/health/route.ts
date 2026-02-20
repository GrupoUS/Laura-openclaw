import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  if (!db) {
    return Response.json(
      { status: 'ok', service: 'laura-dashboard', db: 'not_configured', ts: new Date().toISOString() },
      { status: 200 },
    )
  }

  try {
    await db.execute(sql`SELECT 1`)
    return Response.json({
      status: 'ok',
      service: 'laura-dashboard',
      db: 'connected',
      ts: new Date().toISOString(),
    })
  } catch {
    return Response.json(
      { status: 'error', db: 'disconnected' },
      { status: 503 },
    )
  }
}
