import { getDb } from '@/lib/db'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getDb()
    await db.execute(sql`SELECT 1`)
    return Response.json({
      status: 'ok',
      service: 'laura-dashboard',
      db: 'connected',
      ts: new Date().toISOString(),
    })
  } catch {
    return Response.json(
      { status: 'error', service: 'laura-dashboard', db: 'disconnected' },
      { status: 503 },
    )
  }
}
