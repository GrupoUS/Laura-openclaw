export const dynamic = 'force-dynamic'

/** Diagnostic endpoint — shows which env vars are configured (not their values) */
export async function GET() {
  const envCheck = {
    NEON_DATABASE_URL:       !!process.env.NEON_DATABASE_URL,
    IRON_SESSION_PASSWORD:   (process.env.IRON_SESSION_PASSWORD?.length ?? 0) >= 32,
    LAURA_API_SECRET:        !!process.env.LAURA_API_SECRET,
    UPSTASH_REDIS_REST_URL:  !!process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN:!!process.env.UPSTASH_REDIS_REST_TOKEN,
    UPSTASH_REDIS_URL:       !!process.env.UPSTASH_REDIS_URL,
    REDIS_EVENTS_CHANNEL:    !!process.env.REDIS_EVENTS_CHANNEL,
    TELEGRAM_BOT_TOKEN:      !!process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID:        !!process.env.TELEGRAM_CHAT_ID,
  }

  const missing = Object.entries(envCheck)
    .filter(([, ok]) => !ok)
    .map(([key]) => key)

  return Response.json({
    status: missing.length === 0 ? 'all_configured' : 'missing_vars',
    env: envCheck,
    missing,
    ts: new Date().toISOString(),
  })
}
