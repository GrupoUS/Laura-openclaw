import { useState } from 'react'
import type { SkillEntry } from '@/shared/types/orchestration'
import { useOrchestrationEvents } from '@/client/hooks/useOrchestrationEvents'

export function SkillsMap({ skills }: { skills: SkillEntry[] }) {
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const { liveAgentMap } = useOrchestrationEvents()

  const unassignedSkills = skills.filter((s) => s.unassigned)
  const unassignedCount = unassignedSkills.length

  const agentsMap = new Map<string, string[]>()
  skills.forEach(s => {
    s.assignedAgents.forEach(a => {
      const arr = agentsMap.get(a) ?? []
      arr.push(s.name)
      agentsMap.set(a, arr)
    })
  })

  for (const [agentId, state] of liveAgentMap.entries()) {
    if (Object.keys(state.skillsActive).length > 0) {
      const list = agentsMap.get(agentId) ?? []
      for (const sk of Object.keys(state.skillsActive)) {
        if (!list.includes(sk)) list.push(sk)
      }
      agentsMap.set(agentId, list)
    }
  }

  const agentList = Array.from(agentsMap.keys()).toSorted()

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
            {f === 'assigned' && `Agrupadas (${skills.length - unassignedCount})`}
            {f === 'unassigned' && `Livres (${unassignedCount})`}
          </button>
        ))}
      </div>

      {/* Skills groups */}
      <div className="max-h-[320px] overflow-y-auto space-y-3 pr-2">
        
        {/* Assigned */}
        {(filter === 'all' || filter === 'assigned') && agentList.length > 0 && (
          <div className="space-y-3">
            {agentList.map(agentId => {
              const agentSkills = agentsMap.get(agentId) ?? []
              const liveState = liveAgentMap.get(agentId)
              const skillsActive = liveState?.skillsActive ?? {}

              // Sort by usage count in the last hour
              const sortedSkills = agentSkills.toSorted((a, b) => {
                const usageA = skillsActive[a]
                const usageB = skillsActive[b]
                const countA = usageA && (Date.now() - new Date(usageA.lastUsed).getTime() <= 3600000) ? usageA.count : 0
                const countB = usageB && (Date.now() - new Date(usageB.lastUsed).getTime() <= 3600000) ? usageB.count : 0
                if (countA !== countB) return countB - countA
                return a.localeCompare(b)
              })

              return (
                <div key={agentId} className="border border-indigo-50/50 bg-slate-50 rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    🤖 {agentId}
                    {liveState?.status === 'in_workflow' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" title="Ativo" />
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {sortedSkills.map(s => {
                      const usage = skillsActive[s]
                      const age = usage ? Date.now() - new Date(usage.lastUsed).getTime() : Infinity
                      const hot = age <= 10000
                      const recent = age <= 3600000

                      return (
                        <span 
                          key={s} 
                          title={usage ? `Usada há ${Math.floor(age/1000)}s` : 'Disponível'}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                            hot ? 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse' : 
                            recent ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                            'bg-white text-slate-500 border-slate-200'
                          }`}
                        >
                          {s} {usage?.count ? `(${usage.count})` : ''}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Unassigned */}
        {(filter === 'all' || filter === 'unassigned') && unassignedSkills.length > 0 && (
          <div className="border border-red-100 bg-red-50/30 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-red-600 mb-2">⚠️ Não Atribuídas ({unassignedCount})</h3>
            <div className="flex flex-wrap gap-1.5">
              {unassignedSkills.map((skill) => (
                <span key={skill.name} className="px-2 py-0.5 rounded text-[10px] font-medium border bg-white border-red-200 text-red-700">
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {skills.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">Nenhuma skill encontrada.</p>
        )}
      </div>
    </div>
  )
}
