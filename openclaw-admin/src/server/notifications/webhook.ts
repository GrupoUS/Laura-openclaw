export interface WebhookPayload {
  event:     string
  taskId:    string
  taskTitle: string
  agent:     string | null
  phase:     number
  priority:  string
  dashboardUrl: string
  ts:        string
}

export async function sendWebhook(payload: WebhookPayload): Promise<boolean> {
  const url = process.env.NOTIFY_WEBHOOK_URL
  if (!url) return false

  try {
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error('[Webhook] Failed:', res.status, await res.text())
      return false
    }
    console.log(`[Webhook] ✓ ${payload.event} sent to ${url}`)
    return true
  } catch (e: unknown) {
    console.error('[Webhook] Network error:', e instanceof Error ? e.message : String(e))
    return false
  }
}
