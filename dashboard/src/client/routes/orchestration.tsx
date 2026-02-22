import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { trpc } from '@/client/trpc'
import { OrchestrationDashboard } from '@/client/components/dashboard/orchestration/OrchestrationDashboard'
import { useOrchestrationEvents } from '@/client/hooks/useOrchestrationEvents'
import { ActivityFeed } from '@/client/components/dashboard/agents/ActivityFeed'

export const Route = createFileRoute('/orchestration')({
  component: OrchestrationPage,
})

function OrchestrationPage() {
  const { liveAgentMap } = useOrchestrationEvents()
  const [filterAgent, setFilterAgent] = useState<string | null>(null)

  const queryOpts = { refetchInterval: 10000, staleTime: 0 }
  const { data: hierarchy, isLoading: loadingH } = trpc.orchestration.hierarchy.useQuery(undefined, queryOpts)
  const { data: skillsMap, isLoading: loadingS } = trpc.orchestration.skillsMap.useQuery(undefined, queryOpts)
  const { data: toolsMap, isLoading: loadingT } = trpc.orchestration.toolsMap.useQuery(undefined, queryOpts)
  const { data: tokenData, isLoading: loadingC } = trpc.orchestration.tokenCosts.useQuery(undefined, queryOpts)
  const { data: workflows, isLoading: loadingW } = trpc.orchestration.workflowCycles.useQuery(undefined, queryOpts)
  const { data: alerts, isLoading: loadingA } = trpc.orchestration.alerts.useQuery(undefined, queryOpts)

  const isLoading = loadingH || loadingS || loadingT || loadingC || loadingW || loadingA

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Carregando orquestração...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <OrchestrationDashboard
          hierarchy={hierarchy ?? []}
          skillsMap={skillsMap ?? []}
          toolsMap={toolsMap ?? []}
          tokenCosts={tokenData?.costs ?? []}
          budget={tokenData?.budget ?? 10_000}
          workflowCycles={workflows ?? []}
          alerts={alerts ?? []}
          liveAgentMap={liveAgentMap}
        />
      </div>
      
      {/* Sidebar: Live Activity */}
      <div className="w-80 shrink-0 border-l border-slate-200 bg-white flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-200 shrink-0">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center justify-between">
            <span>🔴 Live Activity</span>
            {filterAgent && (
              <button 
                onClick={() => setFilterAgent(null)}
                className="text-[10px] text-slate-400 hover:text-slate-600 underline"
              >
                Limpar filtro
              </button>
            )}
          </h2>
          <div className="mt-2">
            <select
              className="w-full text-xs border-slate-300 rounded p-1"
              value={filterAgent ?? ''}
              onChange={(e) => setFilterAgent(e.target.value || null)}
            >
              <option value="">Todos os Agentes</option>
              {hierarchy?.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/50">
          <ActivityFeed 
            filterAgentId={filterAgent ?? undefined} 
            maxHeight="100%"
          />
        </div>
      </div>
    </div>
  )
}
