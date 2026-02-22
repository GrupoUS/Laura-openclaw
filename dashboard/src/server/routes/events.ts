/**
 * SSE endpoint — Dashboard real-time events
 * Auth via query param token (EventSource can't send headers)
 */
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { eventBus, type TaskEvent } from '../events/emitter'

const events = new Hono()

const HEARTBEAT_MS = 25_000

events.get('/', async (c) => {
  const token = c.req.query('token')
  const validTokens = [
    process.env.LAURA_API_SECRET,
    process.env.SSE_READ_TOKEN,
  ].filter(Boolean)

  if (!token || !validTokens.includes(token)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const filterAgent = c.req.query('agent') ?? null
  const filterTaskId = c.req.query('taskId') ?? null

  return streamSSE(c, async (stream) => {
    // Connection confirmation
    await stream.writeSSE({
      event: 'connected',
      data: JSON.stringify({
        message: 'Laura Dashboard SSE connected',
        activeListeners: eventBus.getListenerCount() + 1,
        filters: { agent: filterAgent, taskId: filterTaskId },
        ts: new Date().toISOString(),
      }),
    })

    // Event handler with optional filtering
    const handler = async (event: TaskEvent) => {
      if (filterAgent && event.agent !== filterAgent) return
      if (filterTaskId && String(event.taskId) !== filterTaskId) return
      try {
        await stream.writeSSE({
          event: event.type,
          data: JSON.stringify(event),
        })
      } catch {
        // Stream closed
      }
    }

    const unsubscribe = eventBus.subscribe(handler)

    // Heartbeat to prevent proxy timeout
    const heartbeat = setInterval(async () => {
      try {
        await stream.writeSSE({
          event: 'heartbeat',
          data: JSON.stringify({ ts: new Date().toISOString() }),
        })
      } catch {
        clearInterval(heartbeat)
      }
    }, HEARTBEAT_MS)

    console.log(`[SSE] Client connected. Active listeners: ${eventBus.getListenerCount()}`)

    // Cleanup on disconnect
    stream.onAbort(() => {
      clearInterval(heartbeat)
      unsubscribe()
      console.log(`[SSE] Client disconnected. Active listeners: ${eventBus.getListenerCount()}`)
    })

    // Keep stream alive
    while (true) {
      await new Promise(r => setTimeout(r, 1000))
      if (c.req.raw.signal.aborted) break
    }
  })
})

export { events as sseRoutes }
