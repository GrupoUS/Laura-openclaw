import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const generatedAt = new Date().toLocaleString('pt-BR', {
    timeZone:    'America/Sao_Paulo',
    day:   '2-digit', month: '2-digit',
    hour:  '2-digit', minute: '2-digit',
  })

  try {
    const { getAnalytics } = await import('@/lib/db/queries')
    const data = await getAnalytics()
    return <AnalyticsDashboard data={data} generatedAt={generatedAt} />
  } catch (err) {
    console.error('[AnalyticsPage] Failed to fetch analytics:', err instanceof Error ? err.message : err)
    // Return with empty data structure
    const emptyData = {
      kpis: { totalTasks: 0, doneThisWeek: 0, activeNow: 0, blockedNow: 0 },
      phaseProgress: [],
      agentVelocity: [],
      statusDist: [],
      completionTimeline: [],
    }
    return <AnalyticsDashboard data={emptyData} generatedAt={generatedAt} />
  }
}
