import { NextRequest } from 'next/server'
import { getRecentActivity } from '@/lib/db/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const limit = Math.min(
    Number(req.nextUrl.searchParams.get('limit') ?? '30'),
    100  // hard cap
  )
  const events = await getRecentActivity(limit)
  return Response.json({ data: events, count: events.length })
}
