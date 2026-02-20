/**
 * Webhook gen\u00e9rico para extensibilidade futura
 * Conecte qualquer servi\u00e7o (n8n, Make, WhatsApp via OpenClaw webhook, etc.)
 * POST com payload JSON \u2014 consumer decide o que fazer
 */

export interface WebhookPayload {
  event:     string             // 'task:blocked' | 'task:stuck' | 'subtask:blocked'
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
      console.error('[Webhook] Falha:', res.status, await res.text())
      return false
    }
    console.log(`[Webhook] \u2713 ${payload.event} enviado para ${url}`)
    return true
  } catch (e: any) {
    console.error('[Webhook] Erro de rede:', e.message)
    return false
  }
}
