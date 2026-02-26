import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { trpc } from '@/client/trpc'
import { useOrchestrationEvents } from '@/client/hooks/useOrchestrationEvents'
import { useTaskStore, type ActivityEntry } from '@/client/hooks/useTaskStore'
import { ConnectionStatus } from '@/client/components/dashboard/shared/ConnectionStatus'
import { DeskCard } from '@/client/components/dashboard/office/DeskCard'
import { HierarchyTree } from '@/client/components/dashboard/orchestration/HierarchyTree'
import { SkillsMap } from '@/client/components/dashboard/orchestration/SkillsMap'
import { WorkflowCycles } from '@/client/components/dashboard/orchestration/WorkflowCycles'
import { AlertsPanel } from '@/client/components/dashboard/orchestration/AlertsPanel'
import { AgentCard } from '@/client/components/dashboard/agents/AgentCard'
import { ActivityFeed } from '@/client/components/dashboard/agents/ActivityFeed'
import type { Task } from '@/shared/types/tasks'

export const Route = createLazyFileRoute('/office')({
  component: UnifiedOfficePage,
})

type TabId = 'overview' | 'agents' | 'operations'

const TABS: Array<{ id: TabId; label: string; shortLabel: string }> = [
  { id: 'overview',   label: 'Visao Geral',      shortLabel: 'Visao' },
  { id: 'agents',     label: 'Agentes Detalhado', shortLabel: 'Agentes' },
  { id: 'operations', label: 'Skills & Ops',      shortLabel: 'Ops' },
]

const TIER_ORDER = ['Top', 'Dir', 'Builder', 'Mkt', 'Prod'] as const
const TIER_LABELS: Record<string, string> = {
  Top: 'Lideranca',
  Dir: 'Diretores',
  Builder: 'Builders',
  Mkt: 'Marketing',
  Prod: 'Producao',
}

const STATUS_ORDER: Record<string, number> = {
  doing: 0, active: 1, blocked: 2, idle: 3,
}

function UnifiedOfficePage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [search, setSearch] = useState('')

  // -- Real-time hooks --
  const { liveAgentMap } = useOrchestrationEvents()
  const setAgentDetails = useTaskStore((s) => s.setAgentDetails)
  const setTasks = useTaskStore((s) => s.setTasks)

  // -- tRPC queries --
  const queryOpts = { refetchInterval: 10_000, staleTime: 0 }

  const { data: officeAgents = [], isLoading: loadingOffice } =
    trpc.office.list.useQuery(undefined, queryOpts)

  const { data: hierarchy, isLoading: loadingH } =
    trpc.orchestration.hierarchy.useQuery(undefined, queryOpts)

  const { data: skillsMap, isLoading: loadingS } =
    trpc.orchestration.skillsMap.useQuery(undefined, queryOpts)

  const { data: workflows, isLoading: loadingW } =
    trpc.orchestration.workflowCycles.useQuery(undefined, queryOpts)

  const { data: alerts, isLoading: loadingA } =
    trpc.orchestration.alerts.useQuery(undefined, queryOpts)

  const { data: agentsData } = trpc.dashboardAgents.list.useQuery()
  const { data: tasksData } = trpc.tasks.list.useQuery()
  const { data: activityData } = trpc.activity.list.useQuery({ limit: 30 })

  // Hydrate Zustand store
  useEffect(() => {
    if (agentsData?.data) setAgentDetails(agentsData.data)
  }, [agentsData, setAgentDetails])

  useEffect(() => {
    if (tasksData?.data) setTasks(tasksData.data as unknown as Task[])
  }, [tasksData, setTasks])

  const agentDetails = useTaskStore((s) => s.agentDetails)

  // -- Derived data --
  const activeCount = officeAgents.filter((a) => a.status === 'active').length
  const standbyCount = officeAgents.filter((a) => a.status === 'standby').length
  const offlineCount = officeAgents.length - activeCount - standbyCount

  const grouped = useMemo(() => {
    return TIER_ORDER.reduce<Record<string, typeof officeAgents>>((acc, tier) => {
      acc[tier] = officeAgents.filter((a) => a.tier === tier)
      return acc
    }, {})
  }, [officeAgents])

  const sortedAgentDetails = useMemo(() => {
    let list = agentDetails
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((a) => {
        if (a.name.toLowerCase().includes(q)) return true
        const mappedId = a.name === 'laura' ? 'main' : a.name
        const node = (hierarchy ?? []).find(
          (n) => n.id === a.name || n.id === mappedId,
        )
        if (node?.skills.some((s) => s.toLowerCase().includes(q))) return true
        return false
      })
    }
    return list.toSorted(
      (a, b) => (STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4),
    )
  }, [agentDetails, search, hierarchy])

  const initialActivity: ActivityEntry[] = useMemo(
    () =>
      (activityData?.data ?? []).map((e) => ({
        id: String(e.id),
        type: e.eventType,
        taskId: String(e.taskId),
        taskTitle:
          (e as unknown as { task?: { title?: string } }).task?.title ??
          undefined,
        agent: e.agent,
        payload:
          typeof e.payload === 'string'
            ? JSON.parse(e.payload)
            : ((e.payload as Record<string, unknown>) ?? {}),
        ts: e.createdAt,
      })),
    [activityData],
  )

  const alertCount = (alerts ?? []).length
  const hasCritical = (alerts ?? []).some((a) => a.severity === 'critical')

  const isLoading = loadingOffice || loadingH

  // -- Render --
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* === HEADER === */}
      <header className="shrink-0 border-b border-slate-800 bg-slate-950 px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              The Office
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Centro de comando — {officeAgents.length} agentes registrados
            </p>
          </div>

          {/* Status counters */}
          <div className="flex items-center gap-5 text-xs">
            <StatusPill color="green" count={activeCount} label="Ativos" pulse />
            <StatusPill color="yellow" count={standbyCount} label="Standby" />
            <StatusPill color="slate" count={offlineCount} label="Offline" />
            {alertCount > 0 && (
              <div className="flex items-center gap-1.5">
                {hasCritical && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
                <span className="text-red-400 font-medium">
                  {alertCount} alerta{alertCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            <ConnectionStatus />
          </div>
        </div>

        {/* Tab bar */}
        <nav className="flex items-center gap-1 mt-4 -mb-4 border-b border-slate-800">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* === LOADING === */}
      {isLoading && (
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Carregando escritorio...</p>
          </div>
        </div>
      )}

      {/* === TAB CONTENT === */}
      {!isLoading && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              grouped={grouped}
              hierarchy={hierarchy ?? []}
              liveAgentMap={liveAgentMap}
            />
          )}

          {activeTab === 'agents' && (
            <AgentsTab
              agents={sortedAgentDetails}
              hierarchy={hierarchy ?? []}
              search={search}
              onSearchChange={setSearch}
              initialActivity={initialActivity}
            />
          )}

          {activeTab === 'operations' && (
            <OperationsTab
              skillsMap={skillsMap ?? []}
              workflows={workflows ?? []}
              alerts={alerts ?? []}
              loadingS={loadingS}
              loadingW={loadingW}
              loadingA={loadingA}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status Pill
// ---------------------------------------------------------------------------

function StatusPill({
  color,
  count,
  label,
  pulse,
}: {
  color: 'green' | 'yellow' | 'slate'
  count: number
  label: string
  pulse?: boolean
}) {
  const dotColor = {
    green: 'bg-emerald-400',
    yellow: 'bg-amber-400',
    slate: 'bg-slate-600',
  }[color]

  const textColor = {
    green: 'text-emerald-400',
    yellow: 'text-amber-400',
    slate: 'text-slate-500',
  }[color]

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-2 h-2 rounded-full ${dotColor} ${pulse ? 'animate-pulse' : ''}`}
      />
      <span className={`${textColor} font-medium`}>
        {count} {label}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TAB: Overview — Desk cards by tier + Hierarchy tree
// ---------------------------------------------------------------------------

function OverviewTab({
  grouped,
  hierarchy,
  liveAgentMap,
}: {
  grouped: Record<string, Array<{
    id: string
    name: string
    emoji: string
    color: string
    tier: string
    status: 'active' | 'standby' | 'idle'
    lastActivity?: string
    currentTask?: string
  }>>
  hierarchy: import('@/shared/types/orchestration').AgentNode[]
  liveAgentMap: Map<string, import('@/client/hooks/useOrchestrationEvents').LiveAgentState>
}) {
  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
      {/* Desk cards grouped by tier */}
      {TIER_ORDER.map((tier) => {
        const tierAgents = grouped[tier] ?? []
        if (tierAgents.length === 0) return null
        return (
          <section key={tier}>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {TIER_LABELS[tier] ?? tier}
              </h3>
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[10px] text-slate-600">
                {tierAgents.length} agente{tierAgents.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {tierAgents.map((agent) => (
                <DeskCard key={agent.id} agent={agent} />
              ))}
            </div>
          </section>
        )
      })}

      {/* Hierarchy tree */}
      {hierarchy.length > 0 && (
        <section className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            Arvore Hierarquica
            <span className="text-xs text-slate-600 font-normal">
              ({hierarchy.length} nos)
            </span>
          </h2>
          <HierarchyTree
            nodes={hierarchy}
            liveEvents={
              new Map(
                Array.from(liveAgentMap.entries()).map(([k, v]) => [
                  k,
                  v.currentAction,
                ]),
              )
            }
          />
        </section>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TAB: Agents — Detailed agent cards + activity feed sidebar
// ---------------------------------------------------------------------------

function AgentsTab({
  agents,
  hierarchy,
  search,
  onSearchChange,
  initialActivity,
}: {
  agents: import('@/server/db/queries').AgentDetail[]
  hierarchy: import('@/shared/types/orchestration').AgentNode[]
  search: string
  onSearchChange: (v: string) => void
  initialActivity: ActivityEntry[]
}) {
  const [filterAgent, setFilterAgent] = useState<string | null>(null)
  const activeCount = agents.filter(
    (a) => a.status === 'doing' || a.status === 'active',
  ).length

  return (
    <div className="flex h-full min-h-0">
      {/* Main grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 gap-4 shrink-0">
          <span className="text-xs text-slate-500">
            {agents.length} agentes  /  {activeCount} ativo
            {activeCount !== 1 ? 's' : ''}
          </span>
          <input
            type="search"
            placeholder="Buscar por nome ou skill..."
            className="h-7 text-xs border border-slate-700 bg-slate-900 text-slate-300 rounded px-3 w-full max-w-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-600"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {agents.length === 0 ? (
            <div className="text-center text-slate-500 py-16">
              <p className="text-sm">Nenhum agente encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.name}
                  agent={agent}
                  hierarchyNode={(hierarchy ?? []).find(
                    (n) =>
                      n.id === agent.name ||
                      n.id === (agent.name === 'laura' ? 'main' : agent.name),
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity sidebar */}
      <div className="w-72 shrink-0 border-l border-slate-800 bg-slate-950 flex flex-col min-h-0 hidden lg:flex">
        <div className="p-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Live Activity
            </span>
            {filterAgent && (
              <button
                onClick={() => setFilterAgent(null)}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline"
              >
                Limpar
              </button>
            )}
          </div>
          <select
            className="w-full text-[10px] border-slate-700 bg-slate-900 text-slate-400 rounded p-1 mt-2"
            value={filterAgent ?? ''}
            onChange={(e) => setFilterAgent(e.target.value || null)}
          >
            <option value="">Todos os Agentes</option>
            {hierarchy?.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <ActivityFeed
            initialEvents={initialActivity}
            filterAgentId={filterAgent ?? undefined}
            maxHeight="100%"
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TAB: Operations — Skills + Workflows + Alerts
// ---------------------------------------------------------------------------

function OperationsTab({
  skillsMap,
  workflows,
  alerts,
  loadingS,
  loadingW,
  loadingA,
}: {
  skillsMap: import('@/shared/types/orchestration').SkillEntry[]
  workflows: import('@/shared/types/orchestration').WorkflowCycle[]
  alerts: import('@/shared/types/orchestration').AlertItem[]
  loadingS: boolean
  loadingW: boolean
  loadingA: boolean
}) {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Alerts — full width, shown first if any */}
      {alerts.length > 0 && (
        <section className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            Alertas
            <span className="text-xs text-red-400 bg-red-950 px-1.5 py-0.5 rounded font-medium">
              {alerts.length}
            </span>
          </h2>
          {loadingA ? (
            <SkeletonBlock />
          ) : (
            <AlertsPanel alerts={alerts} />
          )}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Map */}
        <section className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            Skills Map
            <span className="text-xs text-slate-600 font-normal">
              ({skillsMap.length} skills)
            </span>
          </h2>
          {loadingS ? <SkeletonBlock /> : <SkillsMap skills={skillsMap} />}
        </section>

        {/* Workflow Cycles */}
        <section className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">
            Ciclos Semanais
          </h2>
          {loadingW ? (
            <SkeletonBlock />
          ) : (
            <WorkflowCycles cycles={workflows} />
          )}
        </section>
      </div>

      {/* Alerts fallback: no alerts */}
      {alerts.length === 0 && !loadingA && (
        <div className="text-center py-6">
          <p className="text-xs text-slate-600">
            Nenhum alerta ativo. Sistema saudavel.
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton placeholder
// ---------------------------------------------------------------------------

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-slate-800 rounded w-3/4" />
      <div className="h-4 bg-slate-800 rounded w-1/2" />
      <div className="h-4 bg-slate-800 rounded w-2/3" />
    </div>
  )
}
