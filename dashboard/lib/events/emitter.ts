/**
 * TaskEventBus — Milestone D
 * Implementação: Upstash Redis Pub/Sub
 * Interface: IDÊNTICA à Milestone B (EventEmitter)
 *
 * PUBLISH → @upstash/redis REST API (edge-safe, fire-and-forget)
 * SUBSCRIBE → ioredis TCP singleton (Node.js-only, recebe de TODAS as instâncias Railway)
 */
import { Redis as UpstashRedis } from '@upstash/redis'
import IoRedis from 'ioredis'
import type { TaskEvent } from './types'

export type { TaskEvent, TaskEventType } from './types'

// ─── Configuração ────────────────────────────────────────────────
const CHANNEL = process.env.REDIS_EVENTS_CHANNEL ?? 'laura:task-events'

function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`[EventBus] Variável de ambiente ausente: ${key}`)
  return val
}

// ─── Publisher — @upstash/redis REST ─────────────────────────────
// REST API: edge-safe, stateless, sem conexão persistente
function getPublisher(): UpstashRedis {
  return new UpstashRedis({
    url:   requireEnv('UPSTASH_REDIS_REST_URL'),
    token: requireEnv('UPSTASH_REDIS_REST_TOKEN'),
  })
}

// ─── Subscriber — ioredis TCP ─────────────────────────────────────
// TCP persistente: recebe mensagens de TODAS as instâncias Railway
// CRÍTICO: conexão em modo SUBSCRIBE não pode fazer PUBLISH
type Handler = (event: TaskEvent) => void

class TaskEventBus {
  private subscriber: IoRedis
  private handlers   = new Set<Handler>()

  constructor() {
    this.subscriber = new IoRedis(requireEnv('UPSTASH_REDIS_URL'), {
      // TLS obrigatório para Upstash (rediss:// já inclui, mas garantir)
      tls: {},
      // Retry com backoff exponencial (Railway pode reiniciar o processo)
      retryStrategy: (times: number) => Math.min(times * 200, 5000),
      // Necessário para modo SUBSCRIBE no Railway [web:93]
      enableAutoPipelining: false,
      // Previne MaxListenersExceeded warning
      maxRetriesPerRequest: null,
      lazyConnect: false,
    })

    // Desativar limite de listeners (SSE: 1 handler por browser conectado)
    this.subscriber.setMaxListeners(0)

    // Subscrever ao canal uma única vez
    this.subscriber.subscribe(CHANNEL, (err) => {
      if (err) {
        console.error(`[EventBus] Falha ao subscrever ${CHANNEL}:`, err.message)
      } else {
        console.log(`[EventBus] Subscrito ao canal Redis: ${CHANNEL}`)
      }
    })

    // Distribuir mensagens Redis → handlers SSE em memória
    this.subscriber.on('message', (channel: string, raw: string) => {
      if (channel !== CHANNEL) return
      try {
        const event: TaskEvent = JSON.parse(raw)
        this.handlers.forEach((h) => {
          try { h(event) } catch { /* handler individual não deve derrubar os outros */ }
        })
      } catch {
        console.warn('[EventBus] Mensagem Redis inválida (não é JSON):', raw)
      }
    })

    // Logs de estado da conexão para Railway logs
    this.subscriber.on('connect',      () => console.log('[EventBus] ioredis conectado'))
    this.subscriber.on('reconnecting', () => console.log('[EventBus] ioredis reconectando...'))
    this.subscriber.on('error',  (e)  => console.error('[EventBus] ioredis erro:', e.message))

    // Graceful shutdown — libera conexão TCP quando Railway envia SIGTERM
    process.once('SIGTERM', () => {
      console.log('[EventBus] SIGTERM recebido — encerrando subscriber')
      this.subscriber.quit().catch(() => { /* ignorar erro no shutdown */ })
    })
  }

  // ─── Interface pública (IDÊNTICA à Milestone B) ──────────────
  // Fire-and-forget: rota HTTP não aguarda confirmação do Redis
  // NeonDB já persistiu o dado — evento SSE é best-effort
  publish(event: TaskEvent): void {
    getPublisher()
      .publish(CHANNEL, JSON.stringify(event))
      .then(() => {
        console.log(`[EventBus] ✓ ${event.type} | task:${event.taskId} | agent:${event.agent ?? 'system'}`)
      })
      .catch((err) => {
        console.error(`[EventBus] ✗ Falha ao publicar ${event.type}:`, err.message)
        // Não lançar — a rota HTTP já retornou 200, dado está no NeonDB
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

// ─── Singleton por instância Railway via globalThis ───────────────
// Previne múltiplas conexões ioredis durante hot-reload em dev
const g = globalThis as unknown as { _lauraEventBus?: TaskEventBus }

export const eventBus: TaskEventBus =
  g._lauraEventBus ?? (g._lauraEventBus = new TaskEventBus())
