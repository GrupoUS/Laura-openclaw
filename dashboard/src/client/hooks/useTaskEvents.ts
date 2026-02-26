import { useEffect, useRef } from 'react'
import { useTaskStore, type ActivityEntry } from './useTaskStore'
import { useOrchestrationEvents } from './useOrchestrationEvents'
import type { Task, Subtask } from '@/shared/types/tasks'

const SSE_TOKEN = import.meta.env.VITE_SSE_READ_TOKEN ?? ''
export const SSE_ENABLED = SSE_TOKEN.length > 0

const toActivity = (e: MessageEvent): ActivityEntry => {
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

export function useTaskEvents() {
  const upsertTask    = useTaskStore((s) => s.upsertTask)
  const upsertSubtask = useTaskStore((s) => s.upsertSubtask)
  const setConnected  = useTaskStore((s) => s.setConnected)
  const pushActivity  = useTaskStore((s) => s.pushActivity)
  const updateAgentFromEvent = useTaskStore((s) => s.updateAgentFromEvent)
  
  const pushAgentStatus = useOrchestrationEvents((s) => s.pushAgentStatus)
  const pushAgentSkill = useOrchestrationEvents((s) => s.pushAgentSkill)
  
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!SSE_TOKEN) {
      return
    }

    const es = new EventSource(`/api/events?token=${SSE_TOKEN}`)
    esRef.current = es

    es.addEventListener('connected', () => {
      setConnected(true)
    })

    es.addEventListener('task:created', (e) => {
      const event = JSON.parse(e.data)
      upsertTask(event.payload as Task)
      pushActivity(toActivity(e as MessageEvent))
      updateAgentFromEvent(event)
    })

    es.addEventListener('task:updated', (e) => {
      const event = JSON.parse(e.data)
      upsertTask(event.payload as Task)
      pushActivity(toActivity(e as MessageEvent))
      updateAgentFromEvent(event)
    })

    es.addEventListener('subtask:created', (e) => {
      const event = JSON.parse(e.data)
      upsertSubtask(event.taskId, event.payload as Subtask)
    })

    es.addEventListener('subtask:updated', (e) => {
      const event = JSON.parse(e.data)
      upsertSubtask(event.taskId, event.payload as Subtask)
      pushActivity(toActivity(e as MessageEvent))
      updateAgentFromEvent(event)
    })

    es.addEventListener('agent:status', (e) => {
      try {
        const event = JSON.parse(e.data)
        const payload = event.payload ?? event
        pushAgentStatus(payload.agentId, payload.status, payload.currentAction)
        updateAgentFromEvent({ type: 'agent:status', agent: payload.agentId, payload })
      } catch { /* ignore parsing errors */ }
    })

    es.addEventListener('agent:skill_used', (e) => {
      try {
        const event = JSON.parse(e.data)
        const payload = event.payload ?? event
        pushAgentSkill(payload.agentId, payload.skill, event.ts || payload.ts)
        pushActivity(toActivity(e as MessageEvent))
      } catch { /* ignore parsing errors */ }
    })

    es.addEventListener('file:updated', (e) => {
      try {
        const event = JSON.parse(e.data)
        window.dispatchEvent(new CustomEvent('file:updated', { detail: event.payload }))
      } catch { /* ignore parsing errors */ }
    })

    es.addEventListener('content:card_created', () => {
      window.dispatchEvent(new CustomEvent('content:invalidate'))
    })

    es.addEventListener('content:card_updated', () => {
      window.dispatchEvent(new CustomEvent('content:invalidate'))
    })

    es.addEventListener('content:card_moved', () => {
      window.dispatchEvent(new CustomEvent('content:invalidate'))
    })

    es.addEventListener('heartbeat', () => setConnected(true))

    es.addEventListener('message', (e) => {
      try {
        const event = JSON.parse(e.data)
        if (event.type?.startsWith('task:'))    upsertTask(event.payload as Task)
        if (event.type?.startsWith('subtask:')) upsertSubtask(event.taskId, event.payload as Subtask)
      } catch { /* not JSON — ignore */ }
    })

    es.addEventListener('error', () => {
      setConnected(false)
    })

    return () => {
      es.close()
      setConnected(false)
    }
  }, [upsertTask, upsertSubtask, setConnected, pushActivity, updateAgentFromEvent, pushAgentStatus, pushAgentSkill])
}
