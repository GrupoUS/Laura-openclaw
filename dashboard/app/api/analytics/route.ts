import { getAnalytics } from '@/lib/db/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await getAnalytics()
  return Response.json({ data, generatedAt: new Date().toISOString() })
}
