import { describe, it, expect, vi } from 'vitest'

// Mock fetch para n\u00e3o chamar API real nos testes
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true, json: async () => ({ ok: true })
}))

describe('Notifications', () => {
  it('sendTelegram retorna false sem envs configuradas', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_CHAT_ID
    const { sendTelegram } = await import('../../lib/notifications/telegram')
    const result = await sendTelegram('<b>Teste</b>')
    expect(result).toBe(false)
  })

  it('notifyBlocked n\u00e3o lan\u00e7a mesmo sem envs', async () => {
    const { notifyBlocked } = await import('../../lib/notifications')
    await expect(
      notifyBlocked({
        event: 'task:blocked', taskId: 'test-id',
        taskTitle: 'Test Task', agent: 'coder',
        phase: 1, priority: 'high',
      })
    ).resolves.not.toThrow()
  })

  it('notifyBlocked chama sendTelegram quando envs presentes', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'fake-token'
    process.env.TELEGRAM_CHAT_ID   = '123'
    const { notifyBlocked } = await import('../../lib/notifications')
    await notifyBlocked({
      event: 'task:blocked', taskId: 'abc',
      taskTitle: 'Tarefa X', agent: 'coder',
      phase: 2, priority: 'critical',
    })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.telegram.org'),
      expect.any(Object)
    )
  })
})
