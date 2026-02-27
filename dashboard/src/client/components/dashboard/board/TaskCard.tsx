
import { useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AgentBadge } from '@/client/components/dashboard/shared/AgentBadge'
import { PriorityBadge } from '@/client/components/dashboard/shared/PriorityBadge'
import { SubtaskProgress } from '@/client/components/dashboard/shared/SubtaskProgress'
import { Badge } from '@/client/components/dashboard/ui/badge'
import type { Task } from '@/shared/types/tasks'

interface Props { task: Task; isDragging?: boolean; onTaskClick?: (task: Task) => void }

export function TaskCard({ task, isDragging, onTaskClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id })

  const pointerStart = useRef<{ x: number; y: number } | null>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStart.current || !onTaskClick) return
    const dx = e.clientX - pointerStart.current.x
    const dy = e.clientY - pointerStart.current.y
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
      onTaskClick(task)
    }
    pointerStart.current = null
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
    opacity: isDragging ? 0.85 : 1,
  }

  const activeAgent = task.subtasks.find((s) => s.status === 'doing')?.agent ?? task.agent

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={`
        group relative
        bg-white dark:bg-slate-800/90
        border border-slate-200/80 dark:border-slate-700/60
        rounded-lg
        transition-all duration-200 ease-out
        cursor-grab active:cursor-grabbing select-none
        p-3
        ${isDragging
          ? 'shadow-xl shadow-slate-300/40 dark:shadow-slate-900/60 scale-[1.03] rotate-[1deg] ring-2 ring-blue-400/30'
          : 'shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5'
        }
        [[data-compact=true]_&]:p-2
      `}
    >
      {/* Header: ID + Priority */}
      <div className="flex items-center justify-between mb-1.5 [[data-compact=true]_&]:mb-1">
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500
                         group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
          #{String(task.id).slice(0, 8)}
        </span>
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Title */}
      <p className="text-[13px] font-medium leading-snug text-slate-800 dark:text-slate-100 line-clamp-2 mb-2
                    [[data-compact=true]_&]:text-xs [[data-compact=true]_&]:mb-1">
        {task.title}
      </p>

      {/* Subtask progress */}
      <div className="[[data-compact=true]_&]:hidden">
        <SubtaskProgress subtasks={task.subtasks} />
      </div>

      {/* Footer: Phase + Agent */}
      <div className="flex items-center justify-between mt-2 [[data-compact=true]_&]:mt-1">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-[18px] font-normal
                                            border-slate-200 dark:border-slate-600
                                            text-slate-500 dark:text-slate-400">
          F{task.phase}
        </Badge>
        <AgentBadge agent={activeAgent} size="sm" />
      </div>
    </div>
  )
}
