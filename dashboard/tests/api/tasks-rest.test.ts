/**
 * Integration tests for REST API endpoints (/api/tasks, /api/agents)
 * Requires: running server (bun dev) + DATABASE_URL + LAURA_API_SECRET
 */
import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'
const SECRET = process.env.LAURA_API_SECRET || ''
const H = {
  'x-laura-secret': SECRET,
  'Content-Type': 'application/json',
}

describe('REST API — Tasks E2E', () => {
  let taskId: number
  let subtaskId: number

  it('GET /api/health → 200 (public)', async () => {
    const res = await fetch(`${BASE}/api/health`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('ok')
  })

  it('GET /api/tasks without header → 401', async () => {
    const res = await fetch(`${BASE}/api/tasks`)
    expect(res.status).toBe(401)
  })

  it('POST /api/tasks → 201 with integer ID', async () => {
    const res = await fetch(`${BASE}/api/tasks`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({
        title: 'REST E2E Test Task',
        agent: 'coder',
        priority: 'high',
      }),
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    taskId = Number(json.data.id)
    expect(taskId).toBeGreaterThan(0)
  })

  it('POST /api/tasks with invalid body → 422', async () => {
    const res = await fetch(`${BASE}/api/tasks`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ title: 'ab' }), // min 3 chars
    })
    expect(res.status).toBe(422)
  })

  it('GET /api/tasks → lists tasks with count', async () => {
    const res = await fetch(`${BASE}/api/tasks`, { headers: H })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.count).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(json.data)).toBe(true)
  })

  it('GET /api/tasks/:id → task with subtasks and events', async () => {
    const res = await fetch(`${BASE}/api/tasks/${taskId}`, { headers: H })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.title).toBe('REST E2E Test Task')
    expect(Array.isArray(json.data.subtasks)).toBe(true)
  })

  it('PATCH /api/tasks/:id → update status', async () => {
    const res = await fetch(`${BASE}/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: H,
      body: JSON.stringify({ status: 'in_progress' }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.status).toBe('in_progress')
  })

  it('GET /api/tasks/:id (non-existent) → 404', async () => {
    const res = await fetch(`${BASE}/api/tasks/999999`, { headers: H })
    expect(res.status).toBe(404)
  })

  it('POST /api/tasks/:id/subtasks → 201', async () => {
    const res = await fetch(`${BASE}/api/tasks/${taskId}/subtasks`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({
        title: 'Atomic subtask via REST',
        agent: 'coder',
        phase: 1,
      }),
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    subtaskId = Number(json.data.id)
    expect(subtaskId).toBeGreaterThan(0)
  })

  it('PATCH subtask todo → doing → 200', async () => {
    const res = await fetch(
      `${BASE}/api/tasks/${taskId}/subtasks/${subtaskId}`,
      {
        method: 'PATCH',
        headers: H,
        body: JSON.stringify({ status: 'doing' }),
      }
    )
    expect(res.status).toBe(200)
  })

  it('PATCH subtask doing → doing (race condition) → 409', async () => {
    const res = await fetch(
      `${BASE}/api/tasks/${taskId}/subtasks/${subtaskId}`,
      {
        method: 'PATCH',
        headers: H,
        body: JSON.stringify({ status: 'doing' }),
      }
    )
    expect(res.status).toBe(409)
  })

  it('GET /api/agents → lists agents with counts', async () => {
    const res = await fetch(`${BASE}/api/agents`, { headers: H })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.data)).toBe(true)
    const coder = json.data.find((a: Record<string, unknown>) => a.name === 'coder')
    expect(coder).toBeTruthy()
  })
})
