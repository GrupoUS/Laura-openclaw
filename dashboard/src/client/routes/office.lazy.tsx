import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { trpc } from '@/client/trpc'
import { useOrchestrationEvents } from '@/client/hooks/useOrchestrationEvents'
import { useTaskStore, type ActivityEntry } from '@/client/hooks/useTaskStore'
import { ConnectionStatus } from '@/client/components/dashboard/shared/ConnectionStatus'
import { DeskCard, type EnrichedAgent } from '@/client/components/dashboard/office/DeskCard'
import { HierarchyTree } from '@/client/components/dashboard/orchestration/HierarchyTree'
import { SkillsMap } from '@/client/components/dashboard/orchestration/SkillsMap'
import { WorkflowCycles } from '@/client/components/dashboard/orchestration/WorkflowCycles'
import { AlertsPanel } from '@/client/components/dashboard/orchestration/AlertsPanel'
import { ActivityFeed } from '@/client/components/dashboard/agents/ActivityFeed'
import type { Task } from '@/shared/types/tasks'

export const Route = createLazyFileRoute('/office')({
  component: UnifiedOfficePage,
})

type TabId = 'overview' | 'operations'

const TABS: Array<{ id: TabId; label: string; shortLabel: string }> = [
  { id: 'overview',   label: 'Visao Geral',  shortLabel: 'Visao' },
  { id: 'operations', label: 'Skills & Ops',  shortLabel: 'Ops' },
]

const TIER_ORDER = ['Top', 'Dir', 'Builder', 'Mkt', 'Prod'] as const
const TIER_LABELS: Record<string, string> = {
  Top: 'Lideranca',
  Dir: 'Diretores',
  Builder: 'Builders',
  Mkt: 'Marketing',
  Prod: 'Producao',
}

function UnifiedOfficePage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [activityOpen, setActivityOpen] = useState(false)

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
  const allTasks = useTaskStore((s) => s.tasks)

  // -- Derived data --
  const activeCount = officeAgents.filter((a) => a.status === 'active').length
  const standbyCount = officeAgents.filter((a) => a.status === 'standby').length
  const offlineCount = officeAgents.length - activeCount - standbyCount

  // Merge all 3 data sources into EnrichedAgent[]
  const enrichedAgents = useMemo<EnrichedAgent[]>(() => {
    return officeAgents.map((oa) => {
      const gatewayId = oa.id === 'main' ? 'laura' : oa.id
      return {
        office: oa,
        detail: agentDetails.find(
          (d) => d.name === oa.id || d.name === gatewayId,
        ),
        live: liveAgentMap.get(oa.id),
        hierarchy: (hierarchy ?? []).find(
          (n) => n.id === oa.id || n.id === gatewayId,
        ),
      }
    })
  }, [officeAgents, agentDetails, liveAgentMap, hierarchy])

  const grouped = useMemo(() => {
    return TIER_ORDER.reduce<Record<string, EnrichedAgent[]>>((acc, tier) => {
      acc[tier] = enrichedAgents.filter((a) => a.office.tier === tier)
      return acc
    }, {})
  }, [enrichedAgents])

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

  const toggleActivity = useCallback(() => setActivityOpen((p) => !p), [])

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

          {/* Activity toggle button — right aligned */}
          {activeTab === 'overview' && (
            <button
              onClick={toggleActivity}
              className={`ml-auto px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activityOpen
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="hidden sm:inline">Live Activity</span>
              <span className="sm:hidden">Live</span>
            </button>
          )}
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
        <div className="flex-1 min-h-0 flex">
          {activeTab === 'overview' && (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <OverviewTab
                  grouped={grouped}
                  hierarchy={hierarchy ?? []}
                  liveAgentMap={liveAgentMap}
                  tasks={allTasks}
                  initialActivity={initialActivity}
                />
              </div>

              {/* Activity sidebar */}
              {activityOpen && (
                <div className="w-72 shrink-0 border-l border-slate-800 bg-slate-950 flex flex-col min-h-0 hidden lg:flex">
                  <div className="p-3 border-b border-slate-800 shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">
                        Live Activity
                      </span>
                      <button
                        onClick={toggleActivity}
                        className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <ActivityFeed
                      initialEvents={initialActivity}
                      maxHeight="100%"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'operations' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <OperationsTab
                skillsMap={skillsMap ?? []}
                workflows={workflows ?? []}
                alerts={alerts ?? []}
                loadingS={loadingS}
                loadingW={loadingW}
                loadingA={loadingA}
              />
            </div>
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
// TAB: Overview — Enriched Desk cards by tier + Hierarchy tree
// ---------------------------------------------------------------------------

function OverviewTab({
  grouped,
  hierarchy,
  liveAgentMap,
  tasks,
  initialActivity,
}: {
  grouped: Record<string, EnrichedAgent[]>
  hierarchy: import('@/shared/types/orchestration').AgentNode[]
  liveAgentMap: Map<string, import('@/client/hooks/useOrchestrationEvents').LiveAgentState>
  tasks: Task[]
  initialActivity: ActivityEntry[]
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
                <DeskCard
                  key={agent.office.id}
                  agent={agent}
                  tasks={tasks}
                  initialActivity={initialActivity}
                />
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
