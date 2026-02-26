import { useState } from 'react'
import { CronDetailModal } from './CronDetailModal'

const DAYS = [
  { label: 'Dom', idx: 0 },
  { label: 'Seg', idx: 1 },
  { label: 'Ter', idx: 2 },
  { label: 'Qua', idx: 3 },
  { label: 'Qui', idx: 4 },
  { label: 'Sex', idx: 5 },
  { label: 'Sáb', idx: 6 },
]

interface CronJob {
  id: string
  name: string
  schedule: string
  enabled: boolean
  daysOfWeek: number[]
  frequent: boolean
  nextRun?: string | null
  lastRun?: string | null
}

interface WeekGridProps {
  crons: CronJob[]
}

export function WeekGrid({ crons }: WeekGridProps) {
  const [selectedCron, setSelectedCron] = useState<CronJob | null>(null)
  const today = new Date().getDay()

  return (
    <>
      <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-700">
          {DAYS.map(({ label, idx }) => (
            <div
              key={label}
              className={`text-center text-xs font-semibold py-2.5 ${
                idx === today
                  ? 'text-indigo-400 bg-indigo-950/30'
                  : 'text-slate-400'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-[200px]">
          {DAYS.map(({ label, idx: dayIdx }) => {
            const dayCrons = crons.filter((c) => c.daysOfWeek.includes(dayIdx))
            const isToday = dayIdx === today

            return (
              <div
                key={label}
                className={`border-r border-slate-800 last:border-r-0 p-2 flex flex-col gap-1.5 ${
                  isToday ? 'bg-indigo-950/10' : ''
                }`}
              >
                {dayCrons.map((cron) => (
                  <button
                    key={cron.id}
                    onClick={() => setSelectedCron(cron)}
                    className={`w-full text-left text-[10px] px-1.5 py-1 rounded border transition-colors hover:opacity-80 truncate ${
                      cron.enabled
                        ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                    title={cron.name}
                  >
                    ⏰ {cron.name}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {selectedCron && (
        <CronDetailModal cron={selectedCron} onClose={() => setSelectedCron(null)} />
      )}
    </>
  )
}
