import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import { spawn } from 'node:child_process'

export const kiwifyWebhookRoute = new Hono()

kiwifyWebhookRoute.post('/', async (c) => {
  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  // Validar token do webhook (configurado no env como KIWIFY_WEBHOOK_TOKEN)
  const expectedToken = process.env.KIWIFY_WEBHOOK_TOKEN
  if (!expectedToken) {
    // eslint-disable-next-line no-console -- startup warning
    console.warn('[kiwify-webhook] KIWIFY_WEBHOOK_TOKEN não configurado — aceitando sem validação de token')
  } else if (body.token !== expectedToken) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  // Só processar compra_aprovada
  if (body.event !== 'compra_aprovada') {
    return c.json({ ok: true, skipped: true })
  }

  const data = (body.data ?? {}) as Record<string, unknown>
  const customer = (data.customer ?? {}) as Record<string, unknown>
  const product = (data.product ?? {}) as Record<string, unknown>

  const name = (customer.name as string | undefined) ?? 'aluno(a)'
  const phone = (customer.mobile as string | undefined) ?? (customer.phone as string | undefined) ?? null
  const email = (customer.email as string | undefined) ?? null
  const productName = (product.name as string | undefined) ?? 'Grupo US'

  if (!phone) {
    // eslint-disable-next-line no-console -- operational warning
    console.warn('[kiwify-webhook] compra_aprovada sem phone:', email)
    return c.json({ ok: true, warning: 'no_phone' })
  }

  // 1. Salvar em NeonDB (tabela laura_memories) para rastreamento
  if (process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL)
      await sql`
        INSERT INTO laura_memories (content, metadata, created_at)
        VALUES (
          ${`Novo aluno ${name} comprou ${productName}`},
          ${JSON.stringify({
            type: 'new_student',
            name,
            phone,
            email,
            product: productName,
            source: 'kiwify_webhook',
            send_status: 'pending',
          })}::jsonb,
          NOW()
        )
      `
    } catch (err) {
      // eslint-disable-next-line no-console -- DB error logging
      console.error('[kiwify-webhook] Erro ao salvar no NeonDB:', (err as Error).message)
    }
  }

  // 2. Disparar mensagem de boas-vindas via OpenClaw WhatsApp
  const firstName = name.split(' ')[0]
  const welcomeMsg = buildWelcomeMessage(firstName, productName)

  try {
    await sendWhatsApp(phone, welcomeMsg)
    // eslint-disable-next-line no-console -- operational log
    console.log(`[kiwify-webhook] ✅ Mensagem enviada para ${name} (${phone})`)
  } catch (err) {
    // eslint-disable-next-line no-console -- fallback warning
    console.warn('[kiwify-webhook] openclaw CLI falhou, salvando como pending_send:', (err as Error).message)
    // Fallback: atualiza status para 'pending_send' no NeonDB para que Laura processe
    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL)
        await sql`
          UPDATE laura_memories
          SET metadata = metadata || ${JSON.stringify({ send_status: 'pending_send', send_error: (err as Error).message })}::jsonb
          WHERE metadata->>'phone' = ${phone}
            AND metadata->>'source' = 'kiwify_webhook'
            AND metadata->>'send_status' = 'pending'
          ORDER BY created_at DESC
          LIMIT 1
        `
      } catch (dbErr) {
        // eslint-disable-next-line no-console -- last-resort log
        console.error('[kiwify-webhook] Falha ao salvar pending_send:', (dbErr as Error).message)
      }
    }
    // Ainda retorna 200 para a Kiwify não ficar retentando
    return c.json({ ok: true, phone, name, product: productName, warning: 'pending_send' })
  }

  return c.json({ ok: true, phone, name, product: productName })
})

/**
 * Rota GET para Laura consultar e reenviar mensagens pendentes
 * POST /api/webhooks/kiwify/flush-pending
 */
kiwifyWebhookRoute.post('/flush-pending', async (c) => {
  const secret = c.req.header('x-laura-secret')
  const validSecret = process.env.LAURA_API_SECRET
  if (validSecret && (!secret || secret !== validSecret)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  if (!process.env.DATABASE_URL) {
    return c.json({ error: 'No DATABASE_URL' }, 500)
  }

  const sql = neon(process.env.DATABASE_URL)
  const rows = await sql`
    SELECT id, content, metadata
    FROM laura_memories
    WHERE metadata->>'source' = 'kiwify_webhook'
      AND metadata->>'send_status' = 'pending_send'
    ORDER BY created_at ASC
    LIMIT 10
  `

  const results = await Promise.all(
    rows.map(async (row) => {
      const meta = row.metadata as Record<string, string>
      const phone = meta.phone
      const firstName = (meta.name ?? 'aluno(a)').split(' ')[0]
      const productName = meta.product ?? 'Grupo US'
      const welcomeMsg = buildWelcomeMessage(firstName, productName)

      try {
        await sendWhatsApp(phone, welcomeMsg)
        await sql`
          UPDATE laura_memories
          SET metadata = metadata || '{"send_status": "sent"}'::jsonb
          WHERE id = ${row.id as number}
        `
        return { id: row.id as number, success: true, phone }
      } catch {
        return { id: row.id as number, success: false, phone }
      }
    })
  )

  return c.json({ ok: true, processed: results.length, results })
})

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

function sendWhatsApp(phone: string, message: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn('openclaw', [
      'message', 'send',
      '--channel', 'whatsapp',
      '--target', phone,
      '--message', message,
    ], { stdio: 'inherit' })
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`openclaw exited with code ${code}`))
    })
    proc.on('error', reject)
  })
}

function buildWelcomeMessage(firstName: string, productName: string): string {
  return `Oi ${firstName}! 💜 Que alegria ter você aqui!

Sou a Mila, da equipe do Grupo US. Sua matrícula em *${productName}* foi confirmada com sucesso! 🎉

Aqui vai o que você precisa saber para começar:

1️⃣ *Acesso à plataforma*: você vai receber um e-mail com seu login e senha em breve. Caso não chegue em até 1 hora, é só me chamar aqui!

2️⃣ *Nossa comunidade*: assim que acessar, entre no grupo de alunos — é lá que acontece a troca de experiências, cases e novidades.

3️⃣ *Dúvidas*: pode me mandar mensagem aqui no WhatsApp a qualquer momento. Estou aqui para te apoiar em toda a sua jornada! 😊

Bem-vinda à família Grupo US! Vai ser incrível. 🚀`
}
