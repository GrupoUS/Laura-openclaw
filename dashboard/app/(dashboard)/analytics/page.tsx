import { getAnalytics }          from '@/lib/db/queries'
import { AnalyticsDashboard }    from '@/components/analytics/AnalyticsDashboard'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const data        = await getAnalytics()
  const generatedAt = new Date().toLocaleString('pt-BR', {
    timeZone:    'America/Sao_Paulo',
    day:   '2-digit', month: '2-digit',
    hour:  '2-digit', minute: '2-digit',
  })

  return <AnalyticsDashboard data={data} generatedAt={generatedAt} />
}
