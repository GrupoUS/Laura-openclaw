const TELEGRAM_API = 'https://api.telegram.org'

export interface TelegramConfig {
  botToken: string
  chatId:   string
}

function getConfig(): TelegramConfig | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId   = process.env.TELEGRAM_CHAT_ID
  if (!botToken || !chatId) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — notifications disabled')
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
      console.error('[Telegram] sendMessage failed:', err.description)
      return false
    }
    return true
  } catch (e: unknown) {
    console.error('[Telegram] Network error:', e instanceof Error ? e.message : String(e))
    return false
  }
}
