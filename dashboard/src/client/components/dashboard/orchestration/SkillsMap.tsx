import { useState } from 'react'
import type { SkillEntry } from '@/shared/types/orchestration'

export function SkillsMap({ skills }: { skills: SkillEntry[] }) {
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')

  const filtered = skills.filter((s) => {
    if (filter === 'assigned') return !s.unassigned
    if (filter === 'unassigned') return s.unassigned
    return true
  })

  const unassignedCount = skills.filter((s) => s.unassigned).length

  return (
    <div className="flex flex-col gap-3">
      {/* Filter tabs */}
      <div className="flex gap-1">
        {(['all', 'assigned', 'unassigned'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
              filter === f
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {f === 'all' && `Todas (${skills.length})`}
            {f === 'assigned' && `Atribuídas (${skills.length - unassignedCount})`}
            {f === 'unassigned' && `Livres (${unassignedCount})`}
          </button>
        ))}
      </div>

      {/* Skills grid */}
      <div className="max-h-[320px] overflow-y-auto space-y-1.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Nenhuma skill encontrada.</p>
        ) : (
          filtered.map((skill) => (
            <div
              key={skill.name}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                skill.unassigned
                  ? 'bg-red-50 border-red-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  skill.unassigned ? 'bg-red-400' : 'bg-emerald-400'
                }`} />
                <span className="text-xs text-slate-700 font-medium truncate">{skill.name}</span>
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                {skill.assignedAgents.length > 0 ? (
                  skill.assignedAgents.slice(0, 3).map((agent) => (
                    <span
                      key={agent}
                      className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium"
                    >
                      {agent}
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                    não atribuída
                  </span>
                )}
                {skill.assignedAgents.length > 3 && (
                  <span className="text-[9px] text-slate-400">
                    +{skill.assignedAgents.length - 3}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
