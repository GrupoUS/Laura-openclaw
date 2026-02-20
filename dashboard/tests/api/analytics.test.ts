import { describe, it, expect } from 'vitest'

const BASE = 'http://localhost:3000'
const H    = { 'x-laura-secret': process.env.LAURA_API_SECRET as string }

describe('Analytics API', () => {
  it('GET /api/analytics → 200 com estrutura correta', async () => {
    const res  = await fetch(`${BASE}/api/analytics`, { headers: H })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveProperty('kpis')
    expect(json.data).toHaveProperty('phaseProgress')
    expect(json.data).toHaveProperty('agentVelocity')
    expect(json.data).toHaveProperty('statusDist')
    expect(json.data).toHaveProperty('completionTimeline')
  })

  it('kpis.totalTasks é número não-negativo', async () => {
    const res  = await fetch(`${BASE}/api/analytics`, { headers: H })
    const json = await res.json()
    expect(typeof json.data.kpis.totalTasks).toBe('number')
    expect(json.data.kpis.totalTasks).toBeGreaterThanOrEqual(0)
  })

  it('completionTimeline items têm date e count', async () => {
    const res  = await fetch(`${BASE}/api/analytics`, { headers: H })
    const json = await res.json()
    const timeline = json.data.completionTimeline
    if (timeline.length > 0) {
      expect(timeline[0]).toHaveProperty('date')
      expect(timeline[0]).toHaveProperty('count')
    }
  })
})
