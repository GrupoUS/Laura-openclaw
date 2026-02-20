import { getDb } from './lib/db'
import { sql } from 'drizzle-orm'

async function run() {
  const db = getDb()
  console.log('Criando indices...')
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_task_events_created_at ON task_events (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_task_events_agent ON task_events (agent, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_task_events_task_id ON task_events (task_id, created_at DESC);
  `)
  console.log('Indices criados!')
  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
