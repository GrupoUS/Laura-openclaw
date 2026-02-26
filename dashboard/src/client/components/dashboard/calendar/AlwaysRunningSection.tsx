interface CronJob {
  id: string
  name: string
  schedule: string
  enabled: boolean
  frequent: boolean
  nextRun?: string | null
  lastRun?: string | null
}

interface AlwaysRunningSectionProps {
  crons: CronJob[]
}

function parseInterval(schedule: string): string {
  const parts = schedule.trim().split(/\s+/)
  if (parts[0]?.startsWith('*/')) {
    const mins = parseInt(parts[0].slice(2), 10)
    if (!isNaN(mins)) return `${mins}min`
  }
  return schedule
}

export function AlwaysRunningSection({ crons }: AlwaysRunningSectionProps) {
  if (crons.length === 0) return null

  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🔄</span>
        <h3 className="text-sm font-semibold text-slate-300">Always Running</h3>
        <span className="text-xs text-slate-500">— Tarefas contínuas</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {crons.map((cron) => (
          <div
            key={cron.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
              cron.enabled
                ? 'bg-green-950/40 border-green-800 text-green-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${cron.enabled ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
            <span>{cron.name}</span>
            <span className="text-[10px] opacity-60">({parseInterval(cron.schedule)})</span>
          </div>
        ))}
      </div>
    </div>
  )
}
