'use client'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Task, Subtask, TaskStatus } from '@/types/tasks'

interface TaskStore {
  tasks: Task[]
  isConnected: boolean

  // Setters
  setTasks: (tasks: Task[]) => void
  setConnected: (v: boolean) => void

  // Mutations
  upsertTask: (task: Task) => void
  upsertSubtask: (taskId: string, subtask: Subtask) => void
  moveTaskOptimistic: (taskId: string, newStatus: TaskStatus) => TaskStatus | null
  rollbackTaskStatus: (taskId: string, prevStatus: TaskStatus) => void

  // Derived
  tasksByStatus: () => Record<TaskStatus, Task[]>
  tasksByPhase:  () => Record<number, Task[]>
}

export const useTaskStore = create<TaskStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      tasks: [],
      isConnected: false,

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
