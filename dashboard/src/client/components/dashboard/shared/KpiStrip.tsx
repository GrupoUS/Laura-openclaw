import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/client/components/dashboard/ui/badge'
import type { Task } from '@/shared/types/tasks'

function AnimatedNumber({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const start = prev.current
    const diff = value - start
    if (diff === 0) return
    const startTime = performance.now()

    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) requestAnimationFrame(step)
      else prev.current = value
    }
    requestAnimationFrame(step)
  }, [value, duration])

  return <>{display}</>
}

interface KpiStripProps {
  tasks: Task[]
}

export function KpiStrip({ tasks }: KpiStripProps) {
  const total = tasks.length
  const active = tasks.filter((t) => t.status === 'in_progress').length
  const done = tasks.filter((t) => t.status === 'done').length
  const blocked = tasks.filter((t) => t.status === 'blocked').length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const kpis = [
    { label: 'Total', value: total, color: 'bg-slate-500' },
    { label: 'Ativas', value: active, color: 'bg-blue-500' },
    { label: 'Concluídas', value: done, color: 'bg-emerald-500' },
    { label: 'Bloqueadas', value: blocked, color: 'bg-red-500' },
  ]

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-200/60 dark:border-slate-700/60
                    bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80
                    dark:from-slate-900/80 dark:via-slate-800/50 dark:to-slate-900/80">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md
                     bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50
                     transition-all hover:scale-[1.02] hover:shadow-sm"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${kpi.color}`} />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{kpi.label}</span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
            <AnimatedNumber value={kpi.value} />
          </span>
        </div>
      ))}

      <div className="ml-auto flex items-center gap-2">
        <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 tabular-nums font-mono">
          {pct}%
        </Badge>
      </div>
    </div>
  )
}
