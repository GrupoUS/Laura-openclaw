#!/usr/bin/env node
// Sync agent_files from NeonDB to local workspace
// Run via: node --input-type=module < scripts/sync_agent_files.js
// OR: cd /Users/mauricio/.openclaw/dashboard && node ../agents/main/workspace/scripts/sync_agent_files.js

import { neon } from '@neondatabase/serverless'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const DB_URL = process.env.NEON_DATABASE_URL ||
  'postgresql://neondb_owner:npg_P0ljy3pWNTYc@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb'

// All workspace files (editable) + PRODUTOS_GRUPO_US.md (read-only, auto-generated)
const WORKSPACE = '/Users/mauricio/.openclaw/agents/main/workspace'
const MEMORY_DIR = join(WORKSPACE, 'memory')

const sql = neon(DB_URL)

// Sync editable files to workspace root
const editableRows = await sql`
  SELECT name, content, updated_by FROM agent_files WHERE is_editable = true
`
let synced = 0
for (const row of editableRows) {
  const path = join(WORKSPACE, row.name)
  await writeFile(path, row.content, 'utf-8')
  if (row.updated_by === 'dashboard') synced++
}

// Sync PRODUTOS_GRUPO_US.md to memory/ folder (for agents to read)
const prodRows = await sql`
  SELECT content, updated_by FROM agent_files WHERE name = 'PRODUTOS_GRUPO_US.md'
`
if (prodRows[0]) {
  await writeFile(join(MEMORY_DIR, 'PRODUTOS_GRUPO_US.md'), prodRows[0].content, 'utf-8')
  if (prodRows[0].updated_by === 'dashboard') synced++
}

console.log(JSON.stringify({
  synced_from_dashboard: synced,
  total_editable: editableRows.length,
  produtos_synced: prodRows.length > 0
}))
