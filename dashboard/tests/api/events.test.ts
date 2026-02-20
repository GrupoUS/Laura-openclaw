import { describe, it, expect } from 'vitest'
import { eventBus } from '../../lib/events/emitter'
import type { TaskEvent } from '../../lib/events/emitter'

describe('TaskEventBus', () => {
  it('emits and receives task:created event', () => {
    const received: TaskEvent[] = []
    const unsub = eventBus.subscribe((e) => received.push(e))

    eventBus.publish({
      type: 'task:created',
      taskId: 'test-123',
      payload: { title: 'Test' },
      agent: 'coder',
      ts: new Date().toISOString(),
    })

    expect(received).toHaveLength(1)
    expect(received[0].type).toBe('task:created')
    expect(received[0].taskId).toBe('test-123')
    expect(received[0].agent).toBe('coder')

    unsub()
  })

  it('cleanup removes listener correctly', () => {
    const before = eventBus.getListenerCount()
    const unsub = eventBus.subscribe(() => {})
    expect(eventBus.getListenerCount()).toBe(before + 1)
    unsub()
    expect(eventBus.getListenerCount()).toBe(before)
  })

  it('supports filtering by agent in subscriber', () => {
    const received: TaskEvent[] = []
    const unsub = eventBus.subscribe((e) => {
      if (e.agent === 'coder') received.push(e)
    })

    eventBus.publish({
      type: 'task:updated',
      taskId: 'a',
      payload: {},
      agent: 'coder',
      ts: '',
    })
    eventBus.publish({
      type: 'task:updated',
      taskId: 'b',
      payload: {},
      agent: 'support',
      ts: '',
    })

    expect(received).toHaveLength(1)
    expect(received[0].taskId).toBe('a')
    unsub()
  })
})
