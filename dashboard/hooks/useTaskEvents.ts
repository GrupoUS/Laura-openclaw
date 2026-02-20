'use client'
import { useEffect, useRef } from 'react'
import { useTaskStore, type ActivityEntry } from './useTaskStore'
import type { Task, Subtask } from '@/types/tasks'

const SSE_TOKEN = process.env.NEXT_PUBLIC_SSE_READ_TOKEN ?? ''

export function useTaskEvents() {
  const upsertTask    = useTaskStore((s) => s.upsertTask)
  const upsertSubtask = useTaskStore((s) => s.upsertSubtask)
  const setConnected  = useTaskStore((s) => s.setConnected)
  const pushActivity  = useTaskStore((s) => s.pushActivity)
  const updateAgentFromEvent = useTaskStore((s) => s.updateAgentFromEvent)
  const esRef = useRef<EventSource | null>(null)

  const toActivity = (e: MessageEvent, type: string): ActivityEntry => {
    const event = JSON.parse(e.data)
    return {
      id:       crypto.randomUUID(),
      type:     event.type,
      taskId:   event.taskId,
      taskTitle: event.payload?.title as string | undefined,
      agent:    event.agent ?? null,
      payload:  event.payload,
      ts:       event.ts,
    }
  }

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
      pushActivity(toActivity(e as MessageEvent, 'task:created'))
      updateAgentFromEvent(event)
    })

    es.addEventListener('task:updated', (e) => {
      const event = JSON.parse(e.data)
      upsertTask(event.payload as Task)
      pushActivity(toActivity(e as MessageEvent, 'task:updated'))
      updateAgentFromEvent(event)
    })

    es.addEventListener('subtask:created', (e) => {
      const event = JSON.parse(e.data)
      upsertSubtask(event.taskId, event.payload as Subtask)
    })

    es.addEventListener('subtask:updated', (e) => {
      const event = JSON.parse(e.data)
      upsertSubtask(event.taskId, event.payload as Subtask)
      pushActivity(toActivity(e as MessageEvent, 'subtask:updated'))
      updateAgentFromEvent(event)
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
