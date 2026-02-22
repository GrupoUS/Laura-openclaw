
import { PRIORITY_COLORS } from '@/shared/types/tasks'
import type { Priority } from '@/shared/types/tasks'

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[priority]}`} />
      <span className="text-xs text-slate-500 capitalize">{priority}</span>
    </span>
  )
}
