
import { useState } from 'react'
import { AgentBadge } from '@/client/components/dashboard/shared/AgentBadge'
import { PriorityBadge } from '@/client/components/dashboard/shared/PriorityBadge'
import { patchSubtaskStatus } from '@/client/lib/api'
import { useTaskStore } from '@/client/hooks/useTaskStore'
import type { Task } from '@/shared/types/tasks'

export function TaskRow({ task }: { task: Task }) {
  const [open, setOpen] = useState(false)
  const upsertSubtask = useTaskStore((s) => s.upsertSubtask)
  const doneCount = task.subtasks.filter((s) => s.status === 'done').length

  const toggleSubtask = async (sid: string, current: string) => {
    const newStatus = current === 'done' ? 'todo' : 'done'
    const result = await patchSubtaskStatus(task.id, sid, newStatus as 'todo' | 'done')
    if (result) upsertSubtask(task.id, result)
  }

  return (
    <div className="border-b border-slate-100 last:border-0">
      {/* Task row */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-slate-400 text-xs w-4">{open ? '▾' : '▸'}</span>
        <span className={`text-sm font-medium flex-1 ${
          task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'
        }`}>
          {task.title}
        </span>
        <span className="text-xs text-slate-400">{doneCount}/{task.subtasks.length}</span>
        <PriorityBadge priority={task.priority} />
        <AgentBadge agent={task.agent} size="sm" />
      </button>

      {/* Expanded subtasks */}
      {open && (
        <div className="ml-10 border-l-2 border-slate-100 mb-1">
          {task.subtasks.length === 0 && (
            <p className="text-xs text-slate-400 px-4 py-1.5">Sem subtarefas</p>
          )}
          {task.subtasks.map((st) => (
            <button
              key={st.id}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-1.5 hover:bg-slate-50 text-left"
              onClick={() => toggleSubtask(st.id, st.status)}
            >
              <input
                type="checkbox"
                checked={st.status === 'done'}
                readOnly
                className="w-3.5 h-3.5 accent-blue-500 cursor-pointer pointer-events-none"
              />
              <span className={`text-xs flex-1 ${
                st.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'
              }`}>
                {st.title}
              </span>
              {st.status === 'doing' && (
                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded animate-pulse">
                  ⚡ em execução
                </span>
              )}
              <AgentBadge agent={st.agent} size="sm" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
