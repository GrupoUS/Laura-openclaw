const TELEGRAM_API = 'https://api.telegram.org'

export interface TelegramConfig {
  botToken: string
  chatId:   string
}

function getConfig(): TelegramConfig | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId   = process.env.TELEGRAM_CHAT_ID
  if (!botToken || !chatId) {
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
      return false
    }
    return true
  } catch {
    return false
  }
}
