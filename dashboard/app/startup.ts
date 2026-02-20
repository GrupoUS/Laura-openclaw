// Executado uma vez ao iniciar o servidor Next.js
// Registrar o cron de stuck tasks

let started = false

export function initStartup() {
  if (started) return
  started = true

  const intervalHours = Number(process.env.NOTIFY_STUCK_HOURS ?? '2')
  const intervalMs    = intervalHours * 60 * 60 * 1000

  console.log(`[Startup] StuckCron iniciado — verifica a cada ${intervalHours}h`)

  // Rodar imediatamente na primeira vez, depois a cada N horas
  import('@/lib/notifications/stuck-cron').then(({ checkStuckTasks }) => {
    checkStuckTasks()  // verificação imediata no boot
    setInterval(checkStuckTasks, intervalMs)
  })
}
