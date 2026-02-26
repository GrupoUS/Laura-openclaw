import { KpiCards } from './KpiCards'
import { ObjectionsPanel } from './ObjectionsPanel'
import { LeadsTable } from './LeadsTable'
import { AgentFilesEditor } from './AgentFilesEditor'

interface KpiData {
  leadsContacted: number
  leadsHandedOff: number
  leadsConverted: number
  topObjections: Array<{ objection: string; count: number }>
  conversionRate: number
  avgResponseTime: string
}

interface Props {
  kpis: KpiData
}

export function SdrDashboard({ kpis }: Props) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 flex items-center px-6 shrink-0">
        <h1 className="text-base font-semibold text-slate-900">📞 SDR Dashboard</h1>
        <span className="ml-3 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          Laura &middot; Qualificação de Leads
        </span>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
          {/* Section 1: KPI Cards */}
          <KpiCards data={kpis} />

          {/* Section 2: Two-column content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left — Objections */}
            <section className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <span className="text-base">🛡️</span> Principais Objeções
              </h2>
              <ObjectionsPanel objections={kpis.topObjections} />
            </section>

            {/* Right — Recent Leads */}
            <section className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <span className="text-base">👥</span> Leads Recentes
              </h2>
              <LeadsTable />
            </section>
          </div>

          {/* Section 3: Agent Files Editor */}
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span className="text-base">📝</span> Arquivos do Agente SDR
            </h2>
            <AgentFilesEditor />
          </section>
        </div>
      </div>
    </div>
  )
}
