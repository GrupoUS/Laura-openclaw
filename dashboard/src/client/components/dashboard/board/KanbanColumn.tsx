
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskCard } from './TaskCard'
import { STATUS_LABELS, STATUS_COLORS } from '@/shared/types/tasks'
import type { Task, TaskStatus } from '@/shared/types/tasks'

interface Props { status: TaskStatus; tasks: Task[] }

export function KanbanColumn({ status, tasks }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const colors = STATUS_COLORS[status]

  return (
    <div className={`flex flex-col w-[85vw] md:w-72 snap-center shrink-0 rounded-xl border-2 transition-colors ${
      isOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30' : `${colors.border} ${colors.bg} dark:border-slate-700 dark:bg-slate-800/50`
    }`}>
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 border-b ${colors.border} dark:border-slate-700`}>
        <span className={`text-sm font-semibold ${colors.text} dark:text-slate-100`}>
          {STATUS_LABELS[status]}
        </span>
        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border} dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300`}>
          {tasks.length}
        </span>
      </div>

      {/* Droppable card area */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 p-2 overflow-y-auto flex-1 min-h-[120px]"
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-600 text-center py-4">
            Nenhuma task aqui
          </p>
        )}
      </div>
    </div>
  )
}
