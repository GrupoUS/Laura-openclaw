
import { useState } from 'react'
import { TaskRow } from './TaskRow'
import type { Task } from '@/shared/types/tasks'

export function PhaseGroup({ phase, tasks }: { phase: number; tasks: Task[] }) {
  const [collapsed, setCollapsed] = useState(false)
  const doneCount = tasks.filter((t) => t.status === 'done').length

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 transition-colors text-left rounded-t-lg"
      >
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Fase {phase}
        </span>
        <span className="text-xs text-slate-400 ml-auto">
          {doneCount}/{tasks.length} concluídas
        </span>
        <span className="text-slate-400 text-xs">{collapsed ? '▸' : '▾'}</span>
      </button>
      {!collapsed && (
        <div className="bg-white border border-slate-200 rounded-b-lg overflow-hidden">
          {tasks.map((task) => <TaskRow key={task.id} task={task} />)}
        </div>
      )}
    </div>
  )
}
