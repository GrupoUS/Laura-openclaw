import { sendTelegram } from './telegram'
import { sendWebhook, type WebhookPayload } from './webhook'

const APP_URL = process.env.APP_URL ?? 'https://tasks.laura.gpus.me'

function buildBlockedMessage(data: {
  event: string; taskTitle: string; taskId: string
  agent: string | null; phase: number; priority: string
}): string {
  const agentLabel = data.agent ? `@${data.agent}` : 'sistema'
  const priorityEmoji: Record<string, string> = {
    critical: '🚨', high: '🔴', medium: '🟡', low: '🟢'
  }
  const emoji = data.event === 'task:stuck' ? '⏳' : '🔴'
  const label = data.event === 'task:stuck' ? 'TASK TRAVADA' : 'TASK BLOQUEADA'

  return [
    `${emoji} <b>${label}</b>`,
    ``,
    `📋 <b>${escapeHtml(data.taskTitle)}</b>`,
    `🤖 Agente: ${agentLabel}`,
    `📌 Fase: ${data.phase}`,
    `${priorityEmoji[data.priority] ?? '·'} Prioridade: ${data.priority}`,
    ``,
    `<a href="${APP_URL}/dashboard/board">🗂️ Abrir Kanban</a>`,
  ].join('\n')
}

function escapeHtml(str: string): string {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

export async function notifyBlocked(data: {
  event:     'task:blocked' | 'task:stuck' | 'subtask:blocked'
  taskId:    string
  taskTitle: string
  agent:     string | null
  phase:     number
  priority:  string
}): Promise<void> {
  const html    = buildBlockedMessage(data)
  const payload: WebhookPayload = {
    ...data,
    dashboardUrl: `${APP_URL}/dashboard/board`,
    ts: new Date().toISOString(),
  }

  Promise.allSettled([
    sendTelegram(html),
    sendWebhook(payload),
  ]).then((results) => {
    const [tg, wh] = results
    if (tg.status === 'rejected') console.error('[notify] Telegram failed:', tg.reason)
    if (wh.status === 'rejected') console.error('[notify] Webhook failed:', wh.reason)
  })
}
