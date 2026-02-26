/**
 * File Watcher — watches SDR agent .md files for changes
 * Publishes file:updated events via EventBus when local files change
 */
import { watch } from 'chokidar'
import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { eventBus } from './events/emitter'

const ALLOWED_FILES = new Set(['objecoes.md', 'soul.md', 'produtos.md'])
const DEBOUNCE_MS = 500

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function startFileWatcher(): void {
  const sdrDir = process.env.SDR_AGENT_DIR
  if (!sdrDir) {
    // eslint-disable-next-line no-console
    console.log('[FileWatcher] SDR_AGENT_DIR not set — file watcher disabled')
    return
  }

  const watcher = watch(`${sdrDir}/*.md`, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 300 },
  })

  watcher.on('change', (filePath) => {
    const fileName = basename(filePath)
    if (!ALLOWED_FILES.has(fileName)) return

    // Debounce to avoid duplicate events from editors
    const existing = debounceTimers.get(fileName)
    if (existing) clearTimeout(existing)

    debounceTimers.set(fileName, setTimeout(async () => {
      debounceTimers.delete(fileName)
      try {
        const content = await readFile(filePath, 'utf-8')
        const name = fileName.replace(/\.md$/, '')

        eventBus.publish({
          type: 'file:updated',
          taskId: 0,
          payload: { name, content, source: 'disk' },
          agent: 'file-watcher',
          ts: new Date().toISOString(),
        })
      } catch {
        // File may have been deleted between events
      }
    }, DEBOUNCE_MS))
  })

  // eslint-disable-next-line no-console
  console.log(`[FileWatcher] Watching ${sdrDir}/*.md`)

  process.once('SIGTERM', () => {
    watcher.close()
  })
}
