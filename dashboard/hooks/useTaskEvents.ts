'use client'
import { useEffect, useRef } from 'react'
import { useTaskStore } from './useTaskStore'
import type { Task, Subtask } from '@/types/tasks'

const SSE_TOKEN = process.env.NEXT_PUBLIC_SSE_READ_TOKEN ?? ''

export function useTaskEvents() {
  const upsertTask    = useTaskStore((s) => s.upsertTask)
  const upsertSubtask = useTaskStore((s) => s.upsertSubtask)
  const setConnected  = useTaskStore((s) => s.setConnected)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!SSE_TOKEN) {
      console.warn('[useTaskEvents] NEXT_PUBLIC_SSE_READ_TOKEN not set')
      return
    }

    const es = new EventSource(`/api/events?token=${SSE_TOKEN}`)
    esRef.current = es

    es.addEventListener('connected', () => {
      setConnected(true)
      console.log('[SSE] Connected to Laura Dashboard')
    })

    es.addEventListener('task:created', (e) => {
      const event = JSON.parse(e.data)
      upsertTask(event.payload as Task)
    })

    es.addEventListener('task:updated', (e) => {
      const event = JSON.parse(e.data)
      upsertTask(event.payload as Task)
    })

    es.addEventListener('subtask:created', (e) => {
      const event = JSON.parse(e.data)
      upsertSubtask(event.taskId, event.payload as Subtask)
    })

    es.addEventListener('subtask:updated', (e) => {
      const event = JSON.parse(e.data)
      upsertSubtask(event.taskId, event.payload as Subtask)
    })

    es.addEventListener('heartbeat', () => setConnected(true))

    // Safari iOS fallback — some browsers only support onmessage
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data)
        if (event.type?.startsWith('task:'))    upsertTask(event.payload as Task)
        if (event.type?.startsWith('subtask:')) upsertSubtask(event.taskId, event.payload as Subtask)
      } catch { /* not JSON — ignore */ }
    }

    es.onerror = () => {
      setConnected(false)
      // EventSource auto-reconnects — just update status
    }

    return () => {
      es.close()
      setConnected(false)
    }
  }, [upsertTask, upsertSubtask, setConnected])
}
