import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './db/schema'

const connectionString = process.env.NEON_DATABASE_URL

if (!connectionString && process.env.NODE_ENV === 'production') {
  throw new Error(
    '[dashboard] NEON_DATABASE_URL não configurado.\n' +
    'Adicione às variáveis de ambiente do Railway.'
  )
}

// In development without DB, db will be null — routes must handle this
const sql = connectionString ? neon(connectionString) : null
export const db = sql ? drizzle(sql, { schema }) : null
export type DB = NonNullable<typeof db>
