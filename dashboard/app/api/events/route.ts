import { NextRequest } from 'next/server'
import { eventBus, type TaskEvent } from '@/lib/events/emitter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HEARTBEAT_MS = 25_000

export async function GET(req: NextRequest) {
  // ─── Auth via query param (EventSource can't send headers) ───
  const token = req.nextUrl.searchParams.get('token')
  if (token !== process.env.LAURA_API_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ─── Optional filters ───
  const filterAgent = req.nextUrl.searchParams.get('agent') ?? null
  const filterTaskId = req.nextUrl.searchParams.get('taskId') ?? null

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          )
        } catch {
          // Controller already closed (client disconnected)
        }
      }

      // Connection confirmation
      send('connected', {
        message: 'Laura Dashboard SSE connected',
        activeListeners: eventBus.getListenerCount() + 1,
        filters: { agent: filterAgent, taskId: filterTaskId },
        ts: new Date().toISOString(),
      })

      // Event handler with optional filtering
      const handler = (event: TaskEvent) => {
        if (filterAgent && event.agent !== filterAgent) return
        if (filterTaskId && event.taskId !== filterTaskId) return
        send(event.type, event)
      }

      const unsubscribe = eventBus.subscribe(handler)

      // Heartbeat to prevent Railway/proxy timeout
      const heartbeat = setInterval(() => {
        send('heartbeat', { ts: new Date().toISOString() })
      }, HEARTBEAT_MS)

      // Cleanup on client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        unsubscribe()
        try {
          controller.close()
        } catch {
          /* already closed */
        }
        console.log(
          `[SSE] Client disconnected. Active listeners: ${eventBus.getListenerCount()}`,
        )
      })

      console.log(
        `[SSE] Client connected. Active listeners: ${eventBus.getListenerCount()}`,
      )
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
