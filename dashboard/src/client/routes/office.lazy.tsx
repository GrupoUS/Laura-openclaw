import { createLazyFileRoute } from '@tanstack/react-router'
import { trpc } from '@/client/trpc'
import { DeskCard } from '@/client/components/dashboard/office/DeskCard'

export const Route = createLazyFileRoute('/office')({
  component: OfficePage,
})

const TIER_ORDER = ['Top', 'Dir', 'Builder', 'Mkt', 'Prod']

const TIER_LABELS: Record<string, string> = {
  Top: 'Lideranca',
  Dir: 'Diretores',
  Builder: 'Builders',
  Mkt: 'Marketing',
  Prod: 'Producao',
}

function OfficePage() {
  const { data: agents = [], isLoading, isError } = trpc.office.list.useQuery(undefined, {
    refetchInterval: 10_000,
  })

  const activeCount = agents.filter((a) => a.status === 'active').length
  const standbyCount = agents.filter((a) => a.status === 'standby').length

  const grouped = TIER_ORDER.reduce<Record<string, typeof agents>>((acc, tier) => {
    acc[tier] = agents.filter((a) => a.tier === tier)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">The Office</h2>
          <p className="text-slate-400 text-sm mt-1">Grupo US HQ</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 font-medium">{activeCount} Trabalhando</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="text-yellow-400 font-medium">{standbyCount} Em espera</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span className="text-slate-400 font-medium">
              {agents.length - activeCount - standbyCount} Offline
            </span>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400">Carregando escritorio...</p>
          </div>
        </div>
      )}

      {isError && (
        <div className="bg-red-950/40 border border-red-900 rounded-lg px-4 py-3 text-red-400 text-sm">
          Nao foi possivel carregar os agentes. Gateway pode estar offline.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-8">
          {TIER_ORDER.map((tier) => {
            const tierAgents = grouped[tier] ?? []
            if (tierAgents.length === 0) return null
            return (
              <div key={tier}>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    {TIER_LABELS[tier] ?? tier}
                  </h3>
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-xs text-slate-600">{tierAgents.length} agentes</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {tierAgents.map((agent) => (
                    <DeskCard key={agent.id} agent={agent} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
