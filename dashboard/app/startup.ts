// Executado uma vez ao iniciar o servidor Next.js
// Registrar o cron de stuck tasks

let started = false
const isBuildPhase = process.env.npm_lifecycle_event === 'build'

export function initStartup() {
  if (started || isBuildPhase) return
  started = true

  const intervalHours = Number(process.env.NOTIFY_STUCK_HOURS ?? '2')
  const intervalMs    = intervalHours * 60 * 60 * 1000

  console.log(`[Startup] StuckCron iniciado — verifica a cada ${intervalHours}h`)

  // Rodar imediatamente na primeira vez, depois a cada N horas
  import('@/lib/notifications/stuck-cron').then(({ checkStuckTasks }) => {
    const safeCheck = async () => {
      try {
        await checkStuckTasks()
      } catch (err) {
        console.error('[Startup] StuckCron falhou:', err instanceof Error ? err.message : err)
      }
    }
    safeCheck()  // verificação imediata no boot
    setInterval(safeCheck, intervalMs)
  }).catch((err) => {
    console.error('[Startup] Falha ao carregar stuck-cron:', err instanceof Error ? err.message : err)
  })
}
