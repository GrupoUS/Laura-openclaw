export interface WebhookPayload {
  event:     string
  taskId:    number
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
    return res.ok
  } catch {
    return false
  }
}
