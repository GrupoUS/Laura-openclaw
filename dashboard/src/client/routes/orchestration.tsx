import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '@/client/trpc'
import { OrchestrationDashboard } from '@/client/components/dashboard/orchestration/OrchestrationDashboard'

export const Route = createFileRoute('/orchestration')({
  component: OrchestrationPage,
})

function OrchestrationPage() {
  const { data: hierarchy, isLoading: loadingH } = trpc.orchestration.hierarchy.useQuery()
  const { data: skillsMap, isLoading: loadingS } = trpc.orchestration.skillsMap.useQuery()
  const { data: toolsMap, isLoading: loadingT } = trpc.orchestration.toolsMap.useQuery()
  const { data: tokenData, isLoading: loadingC } = trpc.orchestration.tokenCosts.useQuery()
  const { data: workflows, isLoading: loadingW } = trpc.orchestration.workflowCycles.useQuery()
  const { data: alerts, isLoading: loadingA } = trpc.orchestration.alerts.useQuery()

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
    <OrchestrationDashboard
      hierarchy={hierarchy ?? []}
      skillsMap={skillsMap ?? []}
      toolsMap={toolsMap ?? []}
      tokenCosts={tokenData?.costs ?? []}
      budget={tokenData?.budget ?? 10_000}
      workflowCycles={workflows ?? []}
      alerts={alerts ?? []}
    />
  )
}
