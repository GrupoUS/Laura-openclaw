import { vi } from 'vitest'

const handlers = new Set<Function>()

vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor() {}
    publish(channel: string, message: string) {
      handlers.forEach(h => h(channel, message))
      return Promise.resolve(1)
    }
  }
}))

vi.mock('ioredis', () => ({
  default: class {
    constructor() {}
    setMaxListeners() {}
    subscribe(_c: string, cb: any) { cb?.(null) }
    on(event: string, cb: Function) {
      if (event === 'message') handlers.add(cb)
    }
    quit() { return Promise.resolve() }
  }
}))

process.env.UPSTASH_REDIS_REST_URL = 'https://mock.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token'
process.env.UPSTASH_REDIS_URL = 'rediss://mock'
process.env.REDIS_EVENTS_CHANNEL = 'laura:task-events'
