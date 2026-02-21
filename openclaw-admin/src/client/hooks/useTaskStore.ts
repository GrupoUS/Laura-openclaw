import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Task, Subtask, TaskStatus } from '@/shared/types/tasks'
import type { AgentDetail } from '@/server/db/queries'

export interface ActivityEntry {
  id:        string
  type:      string
  taskId:    string
  taskTitle?: string
  agent:     string | null
  payload:   Record<string, unknown>
  ts:        string
}

interface TaskStore {
  tasks: Task[]
  isConnected: boolean

  setTasks: (tasks: Task[]) => void
  setConnected: (v: boolean) => void

  upsertTask: (task: Task) => void
  upsertSubtask: (taskId: string, subtask: Subtask) => void
  moveTaskOptimistic: (taskId: string, newStatus: TaskStatus) => TaskStatus | null
  rollbackTaskStatus: (taskId: string, prevStatus: TaskStatus) => void

  tasksByStatus: () => Record<TaskStatus, Task[]>
  tasksByPhase:  () => Record<number, Task[]>

  activityLog: ActivityEntry[]
  pushActivity: (entry: ActivityEntry) => void

  agentDetails: AgentDetail[]
  setAgentDetails: (agents: AgentDetail[]) => void
  updateAgentFromEvent: (event: { type: string; taskId: string; agent?: string; payload: Record<string, unknown> }) => void
}

export const useTaskStore = create<TaskStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      tasks: [],
      isConnected: false,
      activityLog: [],
      agentDetails: [],

      pushActivity: (entry) => set((s) => {
        s.activityLog.unshift(entry)
        if (s.activityLog.length > 50) {
          s.activityLog = s.activityLog.slice(0, 50)
        }
      }),

      setAgentDetails: (agents) => set((s) => { s.agentDetails = agents }),

      updateAgentFromEvent: (event) => set((s) => {
        const agentName = event.agent ?? 'system'
        const agent = s.agentDetails.find((a) => a.name === agentName)
        if (!agent) return

        if (event.type === 'subtask:updated') {
          const payload = event.payload as Record<string, unknown>
          const status = String(payload.status)
          const title = String(payload.title)
          const subtaskId = String(payload.subtaskId)
          if (status === 'doing') {
            agent.status = 'doing'
            agent.currentSubtask = { id: subtaskId, title }
          } else if (status === 'done') {
            agent.currentSubtask = null
            agent.status = agent.currentTask ? 'active' : 'idle'
          }
        }
        if (event.type === 'task:updated') {
          const payload = event.payload as Record<string, unknown>
          const status = String(payload.status)
          if (status === 'in_progress') agent.status = agent.currentSubtask ? 'doing' : 'active'
          if (status === 'done' || status === 'backlog') {
            agent.currentTask = null
            agent.status = 'idle'
          }
          if (status === 'blocked') agent.status = 'blocked'
        }
      }),

      setTasks: (tasks) => set((s) => { s.tasks = tasks }),
      setConnected: (v) => set((s) => { s.isConnected = v }),

      upsertTask: (task) => set((s) => {
        const idx = s.tasks.findIndex((t) => t.id === task.id)
        if (idx >= 0) {
          s.tasks[idx] = {
            ...task,
            subtasks: task.subtasks?.length ? task.subtasks : s.tasks[idx].subtasks,
          }
        } else {
          s.tasks.unshift(task)
        }
      }),

      upsertSubtask: (taskId, subtask) => set((s) => {
        const task = s.tasks.find((t) => t.id === taskId)
        if (!task) return
        const idx = task.subtasks.findIndex((st) => st.id === subtask.id)
        if (idx >= 0) task.subtasks[idx] = subtask
        else task.subtasks.push(subtask)
      }),

      moveTaskOptimistic: (taskId, newStatus) => {
        const prev = get().tasks.find((t) => t.id === taskId)?.status ?? null
        set((s) => {
          const task = s.tasks.find((t) => t.id === taskId)
          if (task) task.status = newStatus
        })
        return prev
      },

      rollbackTaskStatus: (taskId, prevStatus) => set((s) => {
        const task = s.tasks.find((t) => t.id === taskId)
        if (task) task.status = prevStatus
      }),

      tasksByStatus: () => {
        const groups: Record<TaskStatus, Task[]> = {
          backlog: [], in_progress: [], done: [], blocked: [],
        }
        for (const t of get().tasks) {
          const col = groups[t.status] ? t.status : 'backlog'
          groups[col].push(t)
        }
        return groups
      },

      tasksByPhase: () => {
        const groups: Record<number, Task[]> = {}
        for (const t of get().tasks) {
          if (!groups[t.phase]) groups[t.phase] = []
          groups[t.phase].push(t)
        }
        return groups
      },
    }))
  )
)
