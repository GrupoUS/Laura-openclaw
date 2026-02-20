import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

describe('Auth — Session', () => {
  it('GET /board sem cookie → redirect 307 para /login', async () => {
    const res = await fetch(`${BASE}/board`, { redirect: 'manual' })
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('POST /api/auth/login senha errada → 401', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'senha-errada' }),
    })
    expect(res.status).toBe(401)
  })

  it('GET /api/tasks com x-laura-secret → 200 (backward compat agentes)', async () => {
    const res = await fetch(`${BASE}/api/tasks`, {
      headers: { 'x-laura-secret': process.env.LAURA_API_SECRET as string },
    })
    expect(res.status).toBe(200)
  })

  it('GET /api/tasks sem auth → 401', async () => {
    const res = await fetch(`${BASE}/api/tasks`)
    expect(res.status).toBe(401)
  })

  it('GET /api/events sem auth → 401 (token inválido)', async () => {
    const res = await fetch(`${BASE}/api/events?token=invalido`)
    expect(res.status).toBe(401)
  })
})
