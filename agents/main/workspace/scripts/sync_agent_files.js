#!/usr/bin/env node
// Sync agent_files from NeonDB to local workspace
// Run via: node scripts/sync_agent_files.js
// Called by Laura's heartbeat to keep local files in sync with dashboard edits

import { neon } from '@neondatabase/serverless'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const DB_URL = process.env.NEON_DATABASE_URL || 'postgresql://neondb_owner:npg_P0ljy3pWNTYc@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb'
const WORKSPACE = '/Users/mauricio/.openclaw/agents/main/workspace'

const sql = neon(DB_URL)

const rows = await sql`SELECT name, content, updated_by FROM agent_files WHERE is_editable = true`
let synced = 0
for (const row of rows) {
  const path = join(WORKSPACE, row.name)
  await writeFile(path, row.content, 'utf-8')
  if (row.updated_by === 'dashboard') synced++
}
console.log(JSON.stringify({ synced, total: rows.length }))
