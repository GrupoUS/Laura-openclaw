import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './db/schema'

// Lazy-init: DB is created on first access, not at import time.
// This prevents build-time crashes when NEON_DATABASE_URL is not set.
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (_db) return _db

  // Accept both DATABASE_URL (standard) and NEON_DATABASE_URL (legacy)
  const url = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL
  if (!url) {
    const msg = [
      '[dashboard] ❌ DATABASE_URL não configurado.',
      'Configure DATABASE_URL (ou NEON_DATABASE_URL) no Railway.',
      'Variáveis obrigatórias:',
      '  - DATABASE_URL             (postgres://...neon.tech/...)',
      '  - IRON_SESSION_PASSWORD    (≥ 32 chars)',
      '  - UPSTASH_REDIS_REST_URL   (https://...upstash.io)',
      '  - UPSTASH_REDIS_REST_TOKEN',
      '  - UPSTASH_REDIS_URL        (rediss://...)',
    ].join('\n')
    console.error(msg)
    throw new Error(msg)
  }

  const sql = neon(url)
  _db = drizzle(sql, { schema })
  return _db
}

// Re-export for backward compatibility — nullable for health check
export const db = null as ReturnType<typeof drizzle<typeof schema>> | null
export type DB = ReturnType<typeof drizzle<typeof schema>>
