import type {
  AgentNode,
  SkillEntry,
  ToolEntry,
  TokenCost,
  WorkflowCycle,
  AlertItem,
} from '@/shared/types/orchestration'
import { HierarchyTree } from './HierarchyTree'
import { SkillsMap } from './SkillsMap'
import { ToolsMap } from './ToolsMap'
import { TokenCosts } from './TokenCosts'
import { WorkflowCycles } from './WorkflowCycles'
import { AlertsPanel } from './AlertsPanel'
import type { LiveAgentState } from '@/client/hooks/useOrchestrationEvents'

interface Props {
  hierarchy: AgentNode[]
  skillsMap: SkillEntry[]
  toolsMap: ToolEntry[]
  tokenCosts: TokenCost[]
  budget: number
  workflowCycles: WorkflowCycle[]
  alerts: AlertItem[]
  liveAgentMap?: Map<string, LiveAgentState>
}

export function OrchestrationDashboard({
  hierarchy,
  skillsMap,
  toolsMap,
  tokenCosts,
  budget,
  workflowCycles,
  alerts,
  liveAgentMap,
}: Props) {
  const activeCount = hierarchy.filter((n) => n.status === 'active' || n.status === 'in_workflow').length
  const totalCost = tokenCosts.reduce((sum, c) => sum + c.cost, 0)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-slate-900">🏗️ Orquestração</h1>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {hierarchy.length} agentes · {activeCount} ativo{activeCount !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
            R$ {totalCost.toLocaleString('pt-BR')} / {budget.toLocaleString('pt-BR')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{alerts.length} alerta{alerts.length !== 1 ? 's' : ''}</span>
          {alerts.some((a) => a.severity === 'critical') && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
      </header>

      {/* 6-Panel Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1400px] mx-auto">

          {/* Panel 1 — Hierarchy Tree (full width) */}
          <section className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span className="text-base">🌳</span> Árvore Hierárquica
            </h2>
            <HierarchyTree nodes={hierarchy} liveEvents={new Map(Array.from(liveAgentMap?.entries() ?? []).map(([k, v]) => [k, v.currentAction]))} />
          </section>

          {/* Panel 2 — Skills Map */}
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span className="text-base">⚡</span> Skills Map
              <span className="text-xs text-slate-400 font-normal">({skillsMap.length} skills)</span>
            </h2>
            <SkillsMap skills={skillsMap} />
          </section>

          {/* Panel 3 — Tools Map */}
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span className="text-base">🔧</span> Tools Map
              <span className="text-xs text-slate-400 font-normal">({toolsMap.length} tools)</span>
            </h2>
            <ToolsMap tools={toolsMap} />
          </section>

          {/* Panel 4 — Token Costs */}
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span className="text-base">💰</span> Custo de Tokens
              <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-normal">mock</span>
            </h2>
            <TokenCosts costs={tokenCosts} budget={budget} />
          </section>

          {/* Panel 5 — Workflow Cycles */}
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span className="text-base">📅</span> Ciclos Semanais
            </h2>
            <WorkflowCycles cycles={workflowCycles} />
          </section>

          {/* Panel 6 — Alerts (full width) */}
          <section className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span className="text-base">🚨</span> Alertas
              {alerts.length > 0 && (
                <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-medium">
                  {alerts.length}
                </span>
              )}
            </h2>
            <AlertsPanel alerts={alerts} />
          </section>
        </div>
      </div>
    </div>
  )
}
