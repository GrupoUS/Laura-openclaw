
import type { AnalyticsData } from '@/server/db/queries'

interface KpiCard {
  icon: string; label: string; value: number
  sub: string; color: string
}

export function KpiCards({ kpis }: { kpis: AnalyticsData['kpis'] }) {
  const cards: KpiCard[] = [
    { icon: '📋', label: 'Total de Tasks',   value: kpis.totalTasks,   sub: 'no sistema',       color: 'text-slate-700 dark:text-slate-200' },
    { icon: '✅', label: 'Concluídas/semana',value: kpis.doneThisWeek, sub: 'últimos 7 dias',   color: 'text-green-600 dark:text-green-400'  },
    { icon: '⚡', label: 'Ativas agora',      value: kpis.activeNow,    sub: 'in progress',       color: 'text-blue-600 dark:text-blue-400'   },
    { icon: '🔴', label: 'Bloqueadas',        value: kpis.blockedNow,   sub: 'requer atenção',   color: 'text-red-600 dark:text-red-400'    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-2xl">{c.icon}</span>
          <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.label}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">{c.sub}</p>
        </div>
      ))}
    </div>
  )
}
