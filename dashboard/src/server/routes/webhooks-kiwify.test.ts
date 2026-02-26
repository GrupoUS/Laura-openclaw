import { describe, it, expect } from 'bun:test'
import { kiwifyWebhookRoute } from './webhooks-kiwify'

const BASE = 'http://localhost'

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

const validPayload = {
  event: 'compra_aprovada',
  token: 'test-token',
  data: {
    id: 'order_123',
    product: { name: 'Pós em Saúde Estética Avançada' },
    customer: {
      name: 'Maria Silva',
      email: 'maria@email.com',
      mobile: '5562999999999',
    },
    status: 'paid',
  },
}

describe('kiwifyWebhookRoute', () => {
  it('evento diferente de compra_aprovada retorna { ok: true, skipped: true }', async () => {
    const res = await kiwifyWebhookRoute.request(makeReq({ event: 'outro_evento', token: 'test-token' }))
    const json = await res.json() as Record<string, unknown>
    expect(json.ok).toBe(true)
    expect(json.skipped).toBe(true)
  })

  it('payload sem phone retorna { ok: true, warning: no_phone }', async () => {
    const payload = {
      ...validPayload,
      data: {
        ...validPayload.data,
        customer: { name: 'Sem Phone', email: 'test@test.com' },
      },
    }
    const res = await kiwifyWebhookRoute.request(makeReq(payload))
    const json = await res.json() as Record<string, unknown>
    expect(json.ok).toBe(true)
    expect(json.warning).toBe('no_phone')
  })

  it('token inválido retorna 401 quando KIWIFY_WEBHOOK_TOKEN está configurado', async () => {
    const originalToken = process.env.KIWIFY_WEBHOOK_TOKEN
    process.env.KIWIFY_WEBHOOK_TOKEN = 'expected-secret'
    try {
      const payload = { ...validPayload, token: 'wrong-token' }
      const res = await kiwifyWebhookRoute.request(makeReq(payload))
      expect(res.status).toBe(401)
    } finally {
      if (originalToken === undefined) delete process.env.KIWIFY_WEBHOOK_TOKEN
      else process.env.KIWIFY_WEBHOOK_TOKEN = originalToken
    }
  })

  it('JSON inválido retorna 400', async () => {
    const req = new Request(`${BASE}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    const res = await kiwifyWebhookRoute.request(req)
    expect(res.status).toBe(400)
  })
})
