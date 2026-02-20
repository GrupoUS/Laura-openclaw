import { sendTelegram } from './telegram'
import { sendWebhook, type WebhookPayload } from './webhook'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tasks.laura.gpus.me'

// Formatar mensagem HTML para Telegram (evita caracteres especiais do MarkdownV2)
function buildBlockedMessage(data: {
  event: string; taskTitle: string; taskId: string
  agent: string | null; phase: number; priority: string
}): string {
  const agentLabel = data.agent ? `@${data.agent}` : 'sistema'
  const priorityEmoji: Record<string, string> = {
    critical: '\ud83d\udea8', high: '\ud83d\udd34', medium: '\ud83d\udfe1', low: '\ud83d\udfe2'
  }
  const emoji = data.event === 'task:stuck' ? '\u23f3' : '\ud83d\udd34'
  const label = data.event === 'task:stuck' ? 'TASK TRAVADA' : 'TASK BLOQUEADA'

  return [
    `${emoji} <b>${label}</b>`,
    ``,
    `\ud83d\udccb <b>${escapeHtml(data.taskTitle)}</b>`,
    `\ud83e\udd16 Agente: ${agentLabel}`,
    `\ud83d\udccc Fase: ${data.phase}`,
    `${priorityEmoji[data.priority] ?? '\u00b7'} Prioridade: ${data.priority}`,
    ``,
    `<a href="${APP_URL}/board">\ud83d\uddc2\ufe0f Abrir Kanban</a>`,
  ].join('\n')
}

function escapeHtml(str: string): string {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

// \u2500\u2500\u2500 Ponto de entrada \u00fanico \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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
    dashboardUrl: `${APP_URL}/board`,
    ts: new Date().toISOString(),
  }

  // Fire-and-forget \u2014 n\u00e3o bloqueia a resposta HTTP
  Promise.allSettled([
    sendTelegram(html),
    sendWebhook(payload),
  ]).then((results) => {
    const [tg, wh] = results
    if (tg.status === 'rejected') console.error('[notify] Telegram falhou:', tg.reason)
    if (wh.status === 'rejected') console.error('[notify] Webhook falhou:', wh.reason)
  })
}
