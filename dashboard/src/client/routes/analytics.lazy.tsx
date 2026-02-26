import { createLazyFileRoute } from '@tanstack/react-router'
import { AnalyticsDashboard } from '@/client/components/dashboard/analytics/AnalyticsDashboard'
import { trpc } from '@/client/trpc'

export const Route = createLazyFileRoute('/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { data, isLoading } = trpc.analytics.get.useQuery()

  const emptyData = {
    kpis: { totalTasks: 0, doneThisWeek: 0, activeNow: 0, blockedNow: 0 },
    phaseProgress: [],
    agentVelocity: [],
    statusDist: [],
    completionTimeline: [],
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AnalyticsDashboard
      data={data?.data ?? emptyData}
      generatedAt={data?.generatedAt ?? new Date().toISOString()}
    />
  )
}
