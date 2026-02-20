/**
 * Telegram Bot API \u2014 notifica\u00e7\u00f5es outbound
 * Reutiliza TELEGRAM_BOT_TOKEN do OpenClaw (mesmo bot)
 * Documenta\u00e7\u00e3o: https://core.telegram.org/bots/api#sendmessage
 */

const TELEGRAM_API = 'https://api.telegram.org'

export interface TelegramConfig {
  botToken: string
  chatId:   string
}

function getConfig(): TelegramConfig | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId   = process.env.TELEGRAM_CHAT_ID
  if (!botToken || !chatId) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID n\u00e3o configurados \u2014 notifica\u00e7\u00f5es desativadas')
    return null
  }
  return { botToken, chatId }
}

export async function sendTelegram(html: string): Promise<boolean> {
  const cfg = getConfig()
  if (!cfg) return false

  try {
    const res = await fetch(
      `${TELEGRAM_API}/bot${cfg.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:                  cfg.chatId,
          text:                     html,
          parse_mode:               'HTML',
          disable_web_page_preview: true,
        }),
      }
    )
    if (!res.ok) {
      const err = await res.json()
      console.error('[Telegram] Falha sendMessage:', err.description)
      return false
    }
    return true
  } catch (e: any) {
    console.error('[Telegram] Erro de rede:', e.message)
    return false
  }
}
