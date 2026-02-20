/**
 * Verifica tasks em in_progress sem update h\u00e1 N horas
 * Chamado ao iniciar o servidor via app/startup.ts
 */
import { getDb } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq, lt, sql } from 'drizzle-orm'
import { notifyBlocked } from '.'

const STUCK_HOURS = Number(process.env.NOTIFY_STUCK_HOURS ?? '2')

// IDs j\u00e1 notificados nesta sess\u00e3o (evitar spam)
const notifiedThisSession = new Set<string>()

export async function checkStuckTasks(): Promise<void> {
  const threshold = new Date(Date.now() - STUCK_HOURS * 60 * 60 * 1000)

  const stuck = await getDb().query.tasks.findMany({
    where: (t) =>
      sql`${t.status} = 'in_progress' AND ${t.updatedAt} < ${threshold}`,
    columns: { id: true, title: true, agent: true, phase: true, priority: true, updatedAt: true },
  })

  for (const task of stuck) {
    if (notifiedThisSession.has(task.id)) continue
    notifiedThisSession.add(task.id)

    const hours = Math.round((Date.now() - new Date(task.updatedAt).getTime()) / 3600000)
    console.log(`[StuckCron] Task travada: ${task.id} | ${hours}h sem update`)

    await notifyBlocked({
      event:     'task:stuck',
      taskId:    task.id,
      taskTitle: `${task.title} (${hours}h sem atualiza\u00e7\u00e3o)`,
      agent:     task.agent,
      phase:     task.phase,
      priority:  task.priority,
    })
  }

  if (stuck.length === 0) {
    console.log('[StuckCron] Nenhuma task travada \u2014 OK')
  }
}
