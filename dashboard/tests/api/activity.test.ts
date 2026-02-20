import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const H    = { 'x-laura-secret': process.env.LAURA_API_SECRET! }

describe('Activity API', () => {
  it('GET /api/activity → 200 com array', async () => {
    const res  = await fetch(`${BASE}/api/activity`, { headers: H })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.data)).toBe(true)
  })

  it('GET /api/activity?limit=5 → máximo 5 items', async () => {
    const res  = await fetch(`${BASE}/api/activity?limit=5`, { headers: H })
    const json = await res.json()
    expect(json.data.length).toBeLessThanOrEqual(5)
  })

  it('GET /api/agents → inclui currentTask e lastActive', async () => {
    const res  = await fetch(`${BASE}/api/agents`, { headers: H })
    const json = await res.json()
    // Se houver agentes, verificar estrutura
    if (json.data.length > 0) {
      const agent = json.data[0]
      expect(agent).toHaveProperty('name')
      expect(agent).toHaveProperty('status')
      expect(agent).toHaveProperty('currentTask')
      expect(agent).toHaveProperty('lastActive')
    }
    expect(Array.isArray(json.data)).toBe(true)
  })

  it('Criar task → evento aparece em /api/activity', async () => {
    // Criar uma task
    await fetch(`${BASE}/api/tasks`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Activity test task', agent: 'coder' }),
    })
    // Aguardar write assíncrono (fire-and-forget)
    await new Promise(r => setTimeout(r, 300))
    // Verificar no feed
    const res  = await fetch(`${BASE}/api/activity?limit=5`, { headers: H })
    const json = await res.json()
    const found = json.data.some((e: any) => e.eventType === 'task:created')
    expect(found).toBe(true)
  })
})
