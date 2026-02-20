import { EventEmitter } from 'node:events'

// ─────────────────────────────────────────────
// Event types emitted by the system
// ─────────────────────────────────────────────
export type TaskEventType =
  | 'task:created'
  | 'task:updated'
  | 'subtask:created'
  | 'subtask:updated'

export interface TaskEvent {
  type: TaskEventType
  taskId: string
  payload: Record<string, unknown>
  agent?: string
  ts: string // ISO 8601
}

// ─────────────────────────────────────────────
// Singleton — shared across all route handlers
// in the same Node.js process
// ─────────────────────────────────────────────
class TaskEventBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(200)
  }

  publish(event: TaskEvent): void {
    this.emit('task_event', event)
    console.log(
      `[EventBus] ${event.type} | task:${event.taskId} | agent:${event.agent ?? 'system'}`,
    )
  }

  subscribe(handler: (event: TaskEvent) => void): () => void {
    this.on('task_event', handler)
    return () => this.off('task_event', handler)
  }

  getListenerCount(): number {
    return this.listenerCount('task_event')
  }
}

// Survive Next.js dev hot-reload via globalThis cache
const globalForEventBus = globalThis as unknown as {
  taskEventBus?: TaskEventBus
}

export const eventBus =
  globalForEventBus.taskEventBus ?? new TaskEventBus()

if (process.env.NODE_ENV !== 'production') {
  globalForEventBus.taskEventBus = eventBus
}
