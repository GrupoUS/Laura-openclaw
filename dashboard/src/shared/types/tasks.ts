export type TaskStatus    = 'backlog' | 'in_progress' | 'done' | 'blocked'
export type SubtaskStatus = 'todo' | 'doing' | 'done' | 'blocked'
export type Priority      = 'low' | 'medium' | 'high' | 'critical'

export interface Subtask {
  id: string
  taskId: string
  title: string
  status: SubtaskStatus
  phase: number
  agent: string | null
  completedAt: string | null
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  phase: number
  priority: Priority
  agent: string | null
  createdAt: string
  updatedAt: string
  subtasks: Subtask[]
}

export interface AgentSummary {
  name: string
  activeTasks: number
  counts: Partial<Record<TaskStatus, number>>
}

// ── Visual mappings ──────────────────────────────────────

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog:     '📋 Backlog',
  in_progress: '⚡ Em Progresso',
  done:        '✅ Concluído',
  blocked:     '🔴 Bloqueado',
}

export const STATUS_COLORS: Record<TaskStatus, { bg: string; border: string; text: string }> = {
  backlog:     { bg: 'bg-gray-50',  border: 'border-gray-200', text: 'text-gray-600' },
  in_progress: { bg: 'bg-blue-50',  border: 'border-blue-300', text: 'text-blue-700' },
  done:        { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
  blocked:     { bg: 'bg-red-50',   border: 'border-red-300',   text: 'text-red-700' },
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  low:      'bg-gray-400',
  medium:   'bg-yellow-400',
  high:     'bg-orange-500',
  critical: 'bg-red-600',
}

export const AGENT_EMOJIS: Record<string, string> = {
  laura:    '🧠',
  coder:    '💻',
  support:  '💬',
  devops:   '⚙️',
  designer: '🎨',
  system:   '🤖',
}
