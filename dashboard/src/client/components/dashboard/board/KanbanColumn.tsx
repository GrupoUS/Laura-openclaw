
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskCard } from './TaskCard'
import { Badge } from '@/client/components/dashboard/ui/badge'
import { ScrollArea } from '@/client/components/dashboard/ui/scroll-area'
import { STATUS_LABELS } from '@/shared/types/tasks'
import type { Task, TaskStatus } from '@/shared/types/tasks'

const COLUMN_THEME: Record<TaskStatus, {
  accent: string; dropBg: string; icon: string; badgeClass: string
}> = {
  backlog:     { accent: 'border-t-slate-400',  dropBg: 'bg-slate-100/50 dark:bg-slate-700/30',  icon: '📋', badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  in_progress: { accent: 'border-t-blue-500',   dropBg: 'bg-blue-50/50 dark:bg-blue-950/30',     icon: '⚡', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  done:        { accent: 'border-t-emerald-500', dropBg: 'bg-emerald-50/50 dark:bg-emerald-950/30', icon: '✅', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
  blocked:     { accent: 'border-t-red-500',     dropBg: 'bg-red-50/50 dark:bg-red-950/30',       icon: '🔴', badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
}

interface Props { status: TaskStatus; tasks: Task[]; onTaskClick?: (task: Task) => void }

export function KanbanColumn({ status, tasks, onTaskClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const theme = COLUMN_THEME[status]
  const label = STATUS_LABELS[status].replace(/^.+\s/, '')

  return (
    <div className={`
      flex flex-col w-[82vw] md:w-[280px] snap-center shrink-0
      rounded-xl border border-slate-200/80 dark:border-slate-700/60
      border-t-2 ${theme.accent}
      bg-white/60 dark:bg-slate-800/40
      backdrop-blur-sm
      transition-all duration-250
      ${isOver ? `ring-2 ring-blue-400/50 ${theme.dropBg} scale-[1.01]` : 'shadow-sm hover:shadow-md'}
    `}>
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">{theme.icon}</span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-tight">
            {label}
          </span>
        </div>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-mono tabular-nums border-0 ${theme.badgeClass}`}>
          {tasks.length}
        </Badge>
      </div>

      {/* Droppable card area */}
      <ScrollArea className="flex-1 min-h-[120px]">
        <div
          ref={setNodeRef}
          className="flex flex-col gap-2 px-2 pb-2"
        >
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task, i) => (
              <div
                key={task.id}
                className="animate-in fade-in slide-in-from-bottom-1"
                style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
              >
                <TaskCard task={task} onTaskClick={onTaskClick} />
              </div>
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-1">
              <span className="text-2xl opacity-20">
                {status === 'done' ? '🎉' : status === 'blocked' ? '🚧' : '📭'}
              </span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Nenhuma task
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
