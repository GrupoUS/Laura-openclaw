interface KpiData {
  leadsContacted: number
  leadsHandedOff: number
  leadsConverted: number
  conversionRate: number
  avgResponseTime: string
}

const CARDS = [
  { key: 'leadsContacted',  label: 'Leads Contatados',     icon: '📱', format: 'number' },
  { key: 'leadsHandedOff',  label: 'Leads Redirecionados', icon: '🔄', format: 'number' },
  { key: 'leadsConverted',  label: 'Leads Convertidos',    icon: '✅', format: 'number' },
  { key: 'conversionRate',  label: 'Taxa de Conversão',    icon: '📈', format: 'percent' },
  { key: 'avgResponseTime', label: 'Tempo Médio Resposta', icon: '⏱️', format: 'string' },
] as const

export function KpiCards({ data }: { data: KpiData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {CARDS.map((card) => {
        const raw = data[card.key as keyof KpiData]
        const value = card.format === 'percent' ? `${raw}%` : String(raw)

        return (
          <div
            key={card.key}
            className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60
                       rounded-xl p-4 flex flex-col gap-1
                       transition-all hover:shadow-sm hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="text-lg">{card.icon}</span>
              <span className="text-xs font-medium uppercase tracking-wide">{card.label}</span>
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              {value}
            </span>
          </div>
        )
      })}
    </div>
  )
}
