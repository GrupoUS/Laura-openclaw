import { createLazyFileRoute } from '@tanstack/react-router'
import { trpc } from '@/client/trpc'
import { SdrDashboard } from '@/client/components/dashboard/sdr/SdrDashboard'

export const Route = createLazyFileRoute('/sdr')({
  component: SdrPage,
})

function SdrPage() {
  const { data: kpis, isLoading } = trpc.sdr.kpis.useQuery(undefined, {
    refetchInterval: 30_000,
    staleTime: 0,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Carregando SDR...</span>
        </div>
      </div>
    )
  }

  return (
    <SdrDashboard
      kpis={kpis ?? {
        leadsContacted: 0,
        leadsHandedOff: 0,
        leadsConverted: 0,
        topObjections: [],
        conversionRate: 0,
        avgResponseTime: '-',
      }}
    />
  )
}
