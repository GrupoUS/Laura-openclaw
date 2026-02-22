
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AgentBadge } from '@/client/components/dashboard/shared/AgentBadge'
import { PriorityBadge } from '@/client/components/dashboard/shared/PriorityBadge'
import { SubtaskProgress } from '@/client/components/dashboard/shared/SubtaskProgress'
import type { Task } from '@/shared/types/tasks'

interface Props { task: Task; isDragging?: boolean }

export function TaskCard({ task, isDragging }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const activeAgent = task.subtasks.find((s) => s.status === 'doing')?.agent ?? task.agent

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm
                 hover:shadow-md hover:border-slate-300 transition-all cursor-grab
                 active:cursor-grabbing select-none"
    >
      {/* Header: ID + Priority */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono text-slate-400">
          #{task.id}
        </span>
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-slate-800 line-clamp-2 mb-2">
        {task.title}
      </p>

      {/* Subtask progress */}
      <SubtaskProgress subtasks={task.subtasks} />

      {/* Footer: Phase + Agent */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
          Fase {task.phase}
        </span>
        <AgentBadge agent={activeAgent} size="sm" />
      </div>
    </div>
  )
}
