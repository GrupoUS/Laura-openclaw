import { getDb } from './lib/db'
import { tasks, subtasks } from './lib/db/schema'
import { and, gte, lte, eq, isNull } from 'drizzle-orm'

async function checkDeadlines() {
  console.log('⏰ Verificando prazos e enviando lembretes...')
  const db = getDb()
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Busca tasks que vencem nas próximas 24h e não estão concluídas
  const urgentTasks = await db.query.tasks.findMany({
    where: and(
      gte(tasks.dueDate, now),
      lte(tasks.dueDate, tomorrow),
      eq(tasks.status, 'in_progress')
    )
  })

  for (const task of urgentTasks) {
    const message = `⚠️ *Lembrete Grupo US*\n\nA tarefa "${task.title}" da área *${task.department}* vence em breve (${task.dueDate?.toLocaleDateString('pt-BR')}).\n\nPor favor, verifique o status no Dashboard.`
    
    console.log(`[WhatsApp] Enviando para ${task.department}: ${message}`)
    
    // Aqui integraria com a API de WhatsApp (OpenClaw message tool ou similar)
    // No contexto do cron do sistema, dispararíamos um webhook ou comando shell
    try {
      // Exemplo de integração via shell do OpenClaw
      // execSync(`openclaw message send --to="DEPT_GROUP_ID" --text="${message}"`)
    } catch (e) {
      console.error('Erro ao enviar notificação:', e)
    }
  }
}

checkDeadlines().then(() => process.exit(0))
