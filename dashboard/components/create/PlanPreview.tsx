'use client'
import { Badge } from '@/components/ui/badge'
import { AGENT_EMOJIS, PRIORITY_COLORS } from '@/types/tasks'

interface Subtask  { title: string; agent: string }
interface Phase    { phase: number; name: string; subtasks: Subtask[] }
export interface TaskPlan {
  title: string; description: string
  priority: string; agent: string; phases: Phase[]
}

export function PlanPreview({ plan }: { plan: TaskPlan }) {
  const totalSubtasks = plan.phases.reduce((acc, p) => acc + p.subtasks.length, 0)
  return (
    <div className="flex flex-col gap-4 mt-2">
      {/* Cabe\u00e7alho do plano */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <p className="font-semibold text-slate-800 text-sm">{plan.title}</p>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[plan.priority as any] ?? 'bg-gray-400'}`} />
          <span className="text-xs text-slate-500 capitalize">{plan.priority}</span>
          <span className="text-xs text-slate-400">\u00b7</span>
          <span className="text-xs text-slate-500">
            {AGENT_EMOJIS[plan.agent] ?? '\ud83e\udd16'} @{plan.agent}
          </span>
          <span className="text-xs text-slate-400 ml-auto">
            {plan.phases.length} fases \u00b7 {totalSubtasks} subtarefas
          </span>
        </div>
      </div>

      {/* Fases */}
      <div className="flex flex-col gap-3">
        {plan.phases.map((phase) => (
          <div key={phase.phase}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Fase {phase.phase} \u2014 {phase.name}
            </p>
            <div className="flex flex-col gap-1">
              {phase.subtasks.map((st, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700 py-1
                                        border-b border-slate-100 last:border-0">
                  <span className="text-slate-300 mt-0.5">\u25e6</span>
                  <span className="flex-1">{st.title}</span>
                  <span className="shrink-0 text-[10px] text-slate-400">
                    {AGENT_EMOJIS[st.agent] ?? '\ud83e\udd16'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
