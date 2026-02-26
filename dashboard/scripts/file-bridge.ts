#!/usr/bin/env bun
/**
 * File Bridge — bidirectional sync between local .md files and NeonDB agent_files
 *
 * PUSH: local file changed → update NeonDB (source = 'disk')
 * PULL: NeonDB changed by dashboard → write to disk (source = 'dashboard')
 *
 * Usage:
 *   DATABASE_URL=... SDR_AGENT_DIR=/path/to/agent/workspace bun scripts/file-bridge.ts
 */
import { watch } from 'chokidar'
import { readFile, writeFile } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('[bridge] DATABASE_URL is required')
  process.exit(1)
}

const sdrDir = process.env.SDR_AGENT_DIR
if (!sdrDir) {
  console.error('[bridge] SDR_AGENT_DIR is required')
  process.exit(1)
}

const sql = neon(DATABASE_URL)
// Map local filenames → NeonDB agent_files names
const FILE_MAP: Record<string, string> = {
  'OBJECOES.md': 'OBJECOES.md',
  'SOUL.md': 'SOUL.md',
  'PRODUTOS_GRUPO_US.md': 'PRODUTOS_GRUPO_US.md',
  'RULES.md': 'RULES.md',
  'SDR_PLAYBOOK.md': 'SDR_PLAYBOOK.md',
}
const ALLOWED = Object.keys(FILE_MAP)
const POLL_MS = 10_000

// Track last-pushed content to avoid echo loops
const lastPushed = new Map<string, string>()
// Debounce timers to batch rapid changes
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

// ── PUSH: local file changed → update NeonDB ──
async function pushToDB(filePath: string) {
  const fileName = basename(filePath)
  if (!ALLOWED.includes(fileName)) return
  const name = FILE_MAP[fileName] ?? fileName

  try {
    const content = await readFile(filePath, 'utf-8')

    // Skip if we just wrote this content from a pull
    if (lastPushed.get(name) === content) {
      lastPushed.delete(name)
      return
    }

    await sql`
      INSERT INTO agent_files (name, content, source, updated_by, updated_at)
      VALUES (${name}, ${content}, 'disk', 'bridge', NOW())
      ON CONFLICT (name) DO UPDATE
        SET content = EXCLUDED.content,
            source = 'disk',
            updated_by = 'bridge',
            updated_at = NOW()
    `
    console.log(`[bridge] pushed ${name} → NeonDB (${content.length} bytes)`)
  } catch (err) {
    console.error(`[bridge] push ${name} failed:`, (err as Error).message)
  }
}

function debouncedPush(filePath: string) {
  const existing = debounceTimers.get(filePath)
  if (existing) clearTimeout(existing)
  debounceTimers.set(filePath, setTimeout(() => {
    debounceTimers.delete(filePath)
    pushToDB(filePath)
  }, 500))
}

// ── PULL: NeonDB changed by dashboard → write to disk ──
async function pullFromDB() {
  try {
    const rows = await sql`
      SELECT name, content, source, updated_at
      FROM agent_files
      WHERE source = 'dashboard'
      ORDER BY updated_at DESC
    `

    for (const row of rows) {
      const name = row.name as string
      // Find the local filename that maps to this NeonDB name
      const localName = Object.entries(FILE_MAP).find(([, v]) => v === name)?.[0]
      if (!localName) continue

      const content = row.content as string
      const filePath = join(sdrDir, localName)

      // Track to avoid push echo
      lastPushed.set(name, content)

      await writeFile(filePath, content, 'utf-8')

      // Mark as synced so we don't pull again
      await sql`
        UPDATE agent_files SET source = 'synced', updated_by = 'bridge'
        WHERE name = ${name} AND source = 'dashboard'
      `
      console.log(`[bridge] pulled ${name} ← NeonDB → disk (${content.length} bytes)`)
    }
  } catch (err) {
    console.error('[bridge] pull failed:', (err as Error).message)
  }
}

// ── Watch local files → push on change ──
const watcher = watch(ALLOWED.map(f => join(sdrDir, f)), {
  ignoreInitial: false,
  awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
})

watcher
  .on('add', debouncedPush)
  .on('change', debouncedPush)
  .on('error', (err) => console.error('[bridge] watcher error:', err.message))

// ── Poll NeonDB for dashboard edits ──
const pollInterval = setInterval(pullFromDB, POLL_MS)

console.log(`[bridge] watching ${sdrDir}/*.md | polling NeonDB every ${POLL_MS / 1000}s`)
console.log(`[bridge] allowed files: ${ALLOWED.join(', ')}`)

// ── Graceful shutdown ──
function shutdown() {
  console.log('[bridge] shutting down...')
  clearInterval(pollInterval)
  for (const t of debounceTimers.values()) clearTimeout(t)
  watcher.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
