/**
 * TaskEventBus — Redis Pub/Sub with in-memory fallback
 * PUBLISH → @upstash/redis REST API (fire-and-forget)
 * SUBSCRIBE → ioredis TCP singleton (receives from ALL Railway instances)
 * FALLBACK → In-memory when Redis env vars are missing
 */
/* eslint-disable no-console -- infrastructure logging is intentional for EventBus observability */
import type { TaskEvent } from './types'

export type { TaskEvent, TaskEventType } from './types'

// ─── Configuration ────────────────────────────────────────────────
const CHANNEL = process.env.REDIS_EVENTS_CHANNEL ?? 'laura:task-events'

const UPSTASH_REST_URL   = process.env.UPSTASH_REDIS_REST_URL   ?? ''
const UPSTASH_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
const UPSTASH_REDIS_URL  = process.env.UPSTASH_REDIS_URL        ?? ''

const REDIS_AVAILABLE = !!(UPSTASH_REST_URL && UPSTASH_REST_TOKEN && UPSTASH_REDIS_URL)

// ─── Handler type ─────────────────────────────────────────────────
type Handler = (event: TaskEvent) => void

// ─── In-Memory EventBus (fallback) ───────────────────────────────
class InMemoryEventBus {
  private handlers = new Set<Handler>()

  publish(event: TaskEvent): void {
    console.log(`[EventBus:mem] ${event.type} | task:${event.taskId} | agent:${event.agent ?? 'system'}`)
    // Synchronous dispatch to all handlers
    for (const h of this.handlers) {
      try { h(event) } catch { /* individual handler must not crash others */ }
    }
  }

  subscribe(handler: Handler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  getListenerCount(): number {
    return this.handlers.size
  }
}

// ─── Redis EventBus (production) ─────────────────────────────────
class RedisEventBus {
  private handlers = new Set<Handler>()
  private subscriber: import('ioredis').default | null = null
  private publisher: import('@upstash/redis').Redis | null = null

  constructor() {
    this.initSubscriber()
    this.initPublisher()
  }

  private async initSubscriber() {
    try {
      const IoRedis = (await import('ioredis')).default
      this.subscriber = new IoRedis(UPSTASH_REDIS_URL, {
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
        this.subscriber?.quit().catch(() => { /* ignore shutdown error */ })
      })
    } catch (err) {
      console.error('[EventBus] Failed to init Redis subscriber:', (err as Error).message)
    }
  }

  private async initPublisher() {
    try {
      const { Redis: UpstashRedis } = await import('@upstash/redis')
      this.publisher = new UpstashRedis({
        url:   UPSTASH_REST_URL,
        token: UPSTASH_REST_TOKEN,
      })
    } catch (err) {
      console.error('[EventBus] Failed to init Upstash publisher:', (err as Error).message)
    }
  }

  publish(event: TaskEvent): void {
    // Always dispatch locally for same-instance SSE
    for (const h of this.handlers) {
      try { h(event) } catch { /* individual handler must not crash others */ }
    }

    // Also publish to Redis for cross-instance
    if (this.publisher) {
      this.publisher
        .publish(CHANNEL, JSON.stringify(event))
        .then(() => {
          console.log(`[EventBus] ✓ ${event.type} | task:${event.taskId} | agent:${event.agent ?? 'system'}`)
        })
        .catch((err) => {
          console.error(`[EventBus] ✗ Failed to publish ${event.type}:`, (err as Error).message)
        })
    } else {
      console.log(`[EventBus:local] ${event.type} | task:${event.taskId} | agent:${event.agent ?? 'system'}`)
    }
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
interface EventBusInterface {
  publish(event: TaskEvent): void
  subscribe(handler: Handler): () => void
  getListenerCount(): number
}

let _eventBus: EventBusInterface | null = null

function getEventBus(): EventBusInterface {
  if (!_eventBus) {
    if (REDIS_AVAILABLE) {
      // eslint-disable-next-line no-console
      console.log('[EventBus] Using Redis Pub/Sub (Upstash)')
      _eventBus = new RedisEventBus()
    } else {
      // eslint-disable-next-line no-console
      console.log('[EventBus] Redis not configured — using in-memory fallback (SSE works for single instance)')
      _eventBus = new InMemoryEventBus()
    }
  }
  return _eventBus
}

export const eventBus = new Proxy({} as EventBusInterface, {
  get(_target, prop) {
    const instance = getEventBus()
    const value = Reflect.get(instance, prop)
    return typeof value === 'function' ? value.bind(instance) : value
  }
})
