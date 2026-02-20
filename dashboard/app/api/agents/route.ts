import { getAgentDetails } from '@/lib/db/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const agents = await getAgentDetails()
  return Response.json({ data: agents, count: agents.length })
}
