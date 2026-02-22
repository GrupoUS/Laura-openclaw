import type { WorkflowCycle } from '@/shared/types/orchestration'

const DAY_EMOJIS: Record<string, string> = {
  Segunda: '🟢',
  Terça: '🔵',
  Quarta: '🟡',
  Quinta: '🟠',
  Sexta: '🔴',
  Sábado: '⚪',
  Domingo: '🟣',
}

export function WorkflowCycles({ cycles }: { cycles: WorkflowCycle[] }) {
  if (cycles.length === 0) {
    return (
      <p className="text-xs text-slate-400 text-center py-4">Nenhum ciclo configurado.</p>
    )
  }

  return (
    <div className="max-h-[320px] overflow-y-auto space-y-2">
      {cycles.map((cycle) => (
        <div key={cycle.weekday} className="bg-slate-50 rounded-lg border border-slate-200 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">{DAY_EMOJIS[cycle.weekday] ?? '📅'}</span>
            <span className="text-xs font-semibold text-slate-700">{cycle.weekday}</span>
            <span className="text-[10px] text-slate-400">
              {cycle.steps.length} atividade{cycle.steps.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-1">
            {cycle.steps.map((step) => (
              <div key={`${step.agent}-${step.action}`} className="flex items-center gap-2 pl-5">
                {step.time && (
                  <span className="text-[9px] text-slate-400 font-mono w-10 shrink-0">{step.time}</span>
                )}
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                  {step.agent}
                </span>
                <span className="text-[10px] text-slate-600 truncate">{step.action}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
