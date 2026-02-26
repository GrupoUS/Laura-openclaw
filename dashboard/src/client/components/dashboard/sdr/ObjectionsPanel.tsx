import { useEffect } from 'react'
import { trpc } from '@/client/trpc'

interface Objection {
  objection: string
  count: number
}

export function ObjectionsPanel({ objections }: { objections: Objection[] }) {
  const max = objections.length > 0 ? Math.max(...objections.map((o) => o.count)) : 1
  const utils = trpc.useUtils()

  // Auto-refresh KPIs via SSE when objections or files change
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { name?: string; type?: string }
      if (detail.name === 'objecoes' || detail.type === 'objection_handled') {
        utils.sdr.kpis.invalidate()
      }
    }
    window.addEventListener('file:updated', handler)
    return () => window.removeEventListener('file:updated', handler)
  }, [utils])

  if (objections.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic">Nenhuma objecao registrada ainda.</p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {objections.map((obj) => (
        <div key={obj.objection} className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700 truncate">{obj.objection}</span>
            <span className="text-xs font-semibold text-slate-500 tabular-nums shrink-0 ml-2">
              {obj.count}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${(obj.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
