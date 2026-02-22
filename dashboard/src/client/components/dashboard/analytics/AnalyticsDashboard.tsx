
import { KpiCards }            from './KpiCards'
import { PhaseProgressChart }  from './PhaseProgressChart'
import { AgentVelocityChart }  from './AgentVelocityChart'
import { StatusDonutChart }    from './StatusDonutChart'
import { CompletionTimeline }  from './CompletionTimeline'
import { ConnectionStatus }    from '@/client/components/dashboard/shared/ConnectionStatus'
import type { AnalyticsData }  from '@/server/db/queries'

interface Props {
  data:        AnalyticsData
  generatedAt: string
}

export function AnalyticsDashboard({ data, generatedAt }: Props) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-slate-900">📊 Analytics</h1>
          <span className="text-xs text-slate-400">
            Atualizado em {generatedAt}
          </span>
        </div>
        <ConnectionStatus />
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
        {/* KPI Cards */}
        <KpiCards kpis={data.kpis} />

        {/* Row 1: Phase + Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PhaseProgressChart data={data.phaseProgress} />
          <StatusDonutChart   data={data.statusDist} total={data.kpis.totalTasks} />
        </div>

        {/* Row 2: Agent Velocity + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AgentVelocityChart    data={data.agentVelocity}       />
          <CompletionTimeline    data={data.completionTimeline}  />
        </div>
      </div>
    </div>
  )
}
