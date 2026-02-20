import { getAgentsSummary } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  const rows = await getAgentsSummary()

  const agents: Record<string, { name: string; counts: Record<string, number>; activeTasks: number }> = {}

  for (const row of rows as Array<{ agent: string; status: string; count: number }>) {
    if (!agents[row.agent]) {
      agents[row.agent] = { name: row.agent, counts: {}, activeTasks: 0 }
    }
    agents[row.agent].counts[row.status] = row.count
    if (row.status === 'in_progress') {
      agents[row.agent].activeTasks = row.count
    }
  }

  return Response.json({ data: Object.values(agents) })
}
