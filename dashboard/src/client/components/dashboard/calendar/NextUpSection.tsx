import { useEffect, useState } from 'react'

interface CronJob {
  id: string
  name: string
  schedule: string
  enabled: boolean
  nextRun?: string | null
}

interface NextUpSectionProps {
  crons: CronJob[]
}

function useCountdown(target: string | null | undefined): string {
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!target) {
      setLabel('—')
      return
    }

    const update = () => {
      const diff = new Date(target).getTime() - Date.now()
      if (diff <= 0) { setLabel('Agora'); return }
      const totalSecs = Math.floor(diff / 1000)
      const hours = Math.floor(totalSecs / 3600)
      const mins = Math.floor((totalSecs % 3600) / 60)
      const secs = totalSecs % 60
      if (hours > 0) setLabel(`${hours}h ${mins}min`)
      else if (mins > 0) setLabel(`${mins}min ${secs}s`)
      else setLabel(`${secs}s`)
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [target])

  return label
}

function NextUpRow({ cron }: { cron: CronJob }) {
  const countdown = useCountdown(cron.nextRun)

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-b-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cron.enabled ? 'bg-blue-400' : 'bg-slate-600'}`} />
        <span className="text-sm text-slate-300 truncate">{cron.name}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs">
        {cron.nextRun && (
          <span className="text-slate-500">
            {new Date(cron.nextRun).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <span className="text-indigo-400 font-mono w-16 text-right">{countdown}</span>
      </div>
    </div>
  )
}

export function NextUpSection({ crons }: NextUpSectionProps) {
  if (crons.length === 0) return null

  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">⏭</span>
        <h3 className="text-sm font-semibold text-slate-300">Next Up</h3>
        <span className="text-xs text-slate-500">— Próximas execuções</span>
      </div>
      <div className="flex flex-col">
        {crons.map((cron) => (
          <NextUpRow key={cron.id} cron={cron} />
        ))}
      </div>
    </div>
  )
}
