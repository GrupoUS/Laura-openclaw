import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './db/schema'

// Lazy-init: DB is created on first access, not at import time.
// This prevents build-time crashes when NEON_DATABASE_URL is not set.
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (_db) return _db

  const url = process.env.NEON_DATABASE_URL
  if (!url) {
    throw new Error(
      '[dashboard] NEON_DATABASE_URL não configurado.\n' +
      'Adicione ao .env.local ou nas variáveis do Railway.'
    )
  }

  const sql = neon(url)
  _db = drizzle(sql, { schema })
  return _db
}

// Re-export for backward compatibility — nullable for health check
export const db = null as ReturnType<typeof drizzle<typeof schema>> | null
export type DB = ReturnType<typeof drizzle<typeof schema>>
