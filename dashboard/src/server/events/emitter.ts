/**
 * TaskEventBus — Redis Pub/Sub
 * PUBLISH → @upstash/redis REST API (fire-and-forget)
 * SUBSCRIBE → ioredis TCP singleton (receives from ALL Railway instances)
 */
/* eslint-disable no-console -- infrastructure logging is intentional for EventBus observability */
import { Redis as UpstashRedis } from '@upstash/redis'
import IoRedis from 'ioredis'
import type { TaskEvent } from './types'

export type { TaskEvent, TaskEventType } from './types'

// ─── Configuration ────────────────────────────────────────────────
const CHANNEL = process.env.REDIS_EVENTS_CHANNEL ?? 'laura:task-events'

function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`[EventBus] Missing env var: ${key}`)
  return val
}

// ─── Publisher — @upstash/redis REST ─────────────────────────────
function getPublisher(): UpstashRedis {
  return new UpstashRedis({
    url:   requireEnv('UPSTASH_REDIS_REST_URL'),
    token: requireEnv('UPSTASH_REDIS_REST_TOKEN'),
  })
}

// ─── Subscriber — ioredis TCP ─────────────────────────────────────
type Handler = (event: TaskEvent) => void

class TaskEventBus {
  private subscriber: IoRedis
  private handlers = new Set<Handler>()

  constructor() {
    this.subscriber = new IoRedis(requireEnv('UPSTASH_REDIS_URL'), {
      tls: {},
      retryStrategy: (times: number) => Math.min(times * 200, 5000),
      enableAutoPipelining: false,
      maxRetriesPerRequest: null,
      lazyConnect: false,
    })

    this.subscriber.setMaxListeners(0)

    this.subscriber.subscribe(CHANNEL, (err) => {
      if (err) {
        console.error(`[EventBus] Failed to subscribe ${CHANNEL}:`, err.message)
      } else {
        console.log(`[EventBus] Subscribed to Redis channel: ${CHANNEL}`)
      }
    })

    this.subscriber.on('message', (channel: string, raw: string) => {
      if (channel !== CHANNEL) return
      try {
        const event: TaskEvent = JSON.parse(raw)
        this.handlers.forEach((h) => {
          try { h(event) } catch { /* individual handler must not crash others */ }
        })
      } catch {
        console.warn('[EventBus] Invalid Redis message (not JSON):', raw)
      }
    })

    this.subscriber.on('connect',      () => console.log('[EventBus] ioredis connected'))
    this.subscriber.on('reconnecting', () => console.log('[EventBus] ioredis reconnecting...'))
    this.subscriber.on('error',  (e)  => console.error('[EventBus] ioredis error:', e.message))

    process.once('SIGTERM', () => {
      console.log('[EventBus] SIGTERM received — shutting down subscriber')
      this.subscriber.quit().catch(() => { /* ignore shutdown error */ })
    })
  }

  publish(event: TaskEvent): void {
    getPublisher()
      .publish(CHANNEL, JSON.stringify(event))
      .then(() => {
        console.log(`[EventBus] ✓ ${event.type} | task:${event.taskId} | agent:${event.agent ?? 'system'}`)
      })
      .catch((err) => {
        console.error(`[EventBus] ✗ Failed to publish ${event.type}:`, err.message)
      })
  }

  subscribe(handler: Handler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  getListenerCount(): number {
    return this.handlers.size
  }
}
/* eslint-enable no-console */

// ─── Module-level singleton ───────────────────────────────────────
// No lazy proxy needed — Bun doesn't have Next.js prerender issue
let _eventBus: TaskEventBus | null = null

export function getEventBus(): TaskEventBus {
  if (!_eventBus) {
    _eventBus = new TaskEventBus()
  }
  return _eventBus
}

export const eventBus = new Proxy({} as TaskEventBus, {
  get(_target, prop) {
    const instance = getEventBus()
    const value = Reflect.get(instance, prop)
    return typeof value === 'function' ? value.bind(instance) : value
  }
})

