
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
      className="
        bg-white dark:bg-slate-800
        border border-slate-200 dark:border-slate-700
        rounded-lg shadow-sm dark:shadow-slate-900/50
        hover:shadow-md dark:hover:shadow-slate-900
        hover:border-slate-300 dark:hover:border-slate-600
        transition-all cursor-grab active:cursor-grabbing select-none
        p-3
        [[data-compact=true]_&]:p-2
      "
    >
      {/* Header: ID + Priority */}
      <div className="flex items-center justify-between mb-1.5 [[data-compact=true]_&]:mb-1">
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
          #{String(task.id).slice(0, 8)}
        </span>
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-2 mb-2 [[data-compact=true]_&]:text-xs [[data-compact=true]_&]:mb-1">
        {task.title}
      </p>

      {/* Subtask progress */}
      <div className="[[data-compact=true]_&]:hidden">
        <SubtaskProgress subtasks={task.subtasks} />
      </div>

      {/* Footer: Phase + Agent */}
      <div className="flex items-center justify-between mt-2 [[data-compact=true]_&]:mt-1">
        <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
          Fase {task.phase}
        </span>
        <AgentBadge agent={activeAgent} size="sm" />
      </div>
    </div>
  )
}

