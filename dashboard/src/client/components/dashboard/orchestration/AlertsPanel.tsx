import type { AlertItem, AlertSeverity } from '@/shared/types/orchestration'

const SEVERITY_CONFIG: Record<AlertSeverity, { icon: string; bg: string; border: string; text: string }> = {
  info:     { icon: 'ℹ️', bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700' },
  warning:  { icon: '⚠️', bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700' },
  critical: { icon: '🔴', bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700' },
}

export function AlertsPanel({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-2xl mb-2">✅</p>
        <p className="text-xs text-slate-400">Nenhum alerta ativo. Sistema saudável.</p>
      </div>
    )
  }

  // Sort: critical → warning → info
  const sortOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }
  const sorted = alerts.toSorted((a, b) => sortOrder[a.severity] - sortOrder[b.severity])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto">
      {sorted.map((alert) => {
        const cfg = SEVERITY_CONFIG[alert.severity]
        return (
          <div
            key={`${alert.type}-${alert.title}`}
            className={`rounded-lg border px-3 py-2.5 ${cfg.bg} ${cfg.border}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">{cfg.icon}</span>
              <div className="min-w-0">
                <p className={`text-xs font-medium ${cfg.text}`}>{alert.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{alert.detail}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
