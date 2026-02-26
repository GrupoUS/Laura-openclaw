/**
 * File Sync Routes — Bidirectional .md file sync for SDR agent workspace
 * Auth: x-laura-secret header OR dashboard session cookie
 */
import { Hono } from 'hono'
import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { getCookie } from 'hono/cookie'
import { unsealData } from 'iron-session'
import { SESSION_OPTIONS } from '../session'
import { eventBus } from '../events/emitter'

const files = new Hono()

const ALLOWED_FILES = ['objecoes', 'soul', 'produtos'] as const
type AllowedFile = (typeof ALLOWED_FILES)[number]

function isAllowedFile(name: string): name is AllowedFile {
  return (ALLOWED_FILES as readonly string[]).includes(name)
}

function getSdrDir(): string | null {
  return process.env.SDR_AGENT_DIR ?? null
}

// Write lock per file to prevent concurrent writes
const writeLocks = new Map<string, boolean>()

// ── Auth middleware ────────────────────────────────────────────────
files.use('*', async (c, next) => {
  // Check x-laura-secret header
  const secret = c.req.header('x-laura-secret')
  if (secret && secret === process.env.LAURA_API_SECRET) {
    return next()
  }

  // Check dashboard session cookie
  const sealed = getCookie(c, 'gw_session')
  if (sealed) {
    try {
      const session = await unsealData<{ authenticated: boolean }>(sealed, {
        password: SESSION_OPTIONS.password,
      })
      if (session.authenticated) return next()
    } catch { /* expired/invalid */ }
  }

  return c.json({ error: 'Unauthorized' }, 401)
})

// ── GET /api/files — list .md files ────────────────────────────────
files.get('/', async (c) => {
  const sdrDir = getSdrDir()
  if (!sdrDir) {
    return c.json({ error: 'SDR_AGENT_DIR not configured' }, 503)
  }

  try {
    const entries = await readdir(sdrDir)
    const mdFiles = entries
      .filter((e) => e.endsWith('.md'))
      .map((e) => e.replace(/\.md$/, ''))
      .filter(isAllowedFile)

    const fileList = await Promise.all(
      mdFiles.map(async (name) => {
        const filePath = join(sdrDir, `${name}.md`)
        try {
          const s = await stat(filePath)
          return {
            name,
            sizeKb: Math.round(s.size / 1024),
            lastModified: s.mtime.toISOString(),
          }
        } catch {
          return null
        }
      })
    )

    return c.json({ files: fileList.filter(Boolean) })
  } catch {
    return c.json({ error: 'Failed to list files' }, 500)
  }
})

// ── GET /api/files/:name — read a single file ─────────────────────
files.get('/:name', async (c) => {
  const name = c.req.param('name')
  if (!isAllowedFile(name)) {
    return c.json({ error: `File not allowed: ${name}` }, 400)
  }

  const sdrDir = getSdrDir()
  if (!sdrDir) {
    return c.json({ error: 'SDR_AGENT_DIR not configured' }, 503)
  }

  const filePath = join(sdrDir, `${name}.md`)
  try {
    const content = await readFile(filePath, 'utf-8')
    const s = await stat(filePath)
    return c.json({ content, lastModified: s.mtime.toISOString() })
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return c.json({ error: 'File not found' }, 404)
    }
    return c.json({ error: 'Failed to read file' }, 500)
  }
})

// ── PUT /api/files/:name — write a file + publish event ───────────
files.put('/:name', async (c) => {
  const name = c.req.param('name')
  if (!isAllowedFile(name)) {
    return c.json({ error: `File not allowed: ${name}` }, 400)
  }

  const sdrDir = getSdrDir()
  if (!sdrDir) {
    return c.json({ error: 'SDR_AGENT_DIR not configured' }, 503)
  }

  if (writeLocks.get(name)) {
    return c.json({ error: 'Write in progress' }, 409)
  }

  try {
    writeLocks.set(name, true)
    const body = await c.req.json<{ content: string }>()
    const filePath = join(sdrDir, `${name}.md`)
    await writeFile(filePath, body.content, 'utf-8')

    eventBus.publish({
      type: 'file:updated',
      taskId: 0,
      payload: { name, content: body.content, source: 'dashboard' },
      agent: 'dashboard',
      ts: new Date().toISOString(),
    })

    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Failed to write file' }, 500)
  } finally {
    writeLocks.delete(name)
  }
})

export { files as fileSyncRoutes }
