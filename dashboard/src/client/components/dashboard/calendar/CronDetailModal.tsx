interface CronJob {
  id: string
  name: string
  schedule: string
  enabled: boolean
  nextRun?: string | null
  lastRun?: string | null
}

interface CronDetailModalProps {
  cron: CronJob
  onClose: () => void
}

export function CronDetailModal({ cron, onClose }: CronDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span>⏰</span>
            <h3 className="text-base font-semibold text-slate-100 truncate">{cron.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg">✕</button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Schedule</p>
              <p className="text-sm font-mono text-blue-300">{cron.schedule}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Status</p>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${cron.enabled ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className={`text-sm font-medium ${cron.enabled ? 'text-green-400' : 'text-slate-400'}`}>
                  {cron.enabled ? 'Ativo' : 'Pausado'}
                </span>
              </div>
            </div>
          </div>

          {cron.nextRun && (
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Próxima Execução</p>
              <p className="text-sm text-slate-200">
                {new Date(cron.nextRun).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            </div>
          )}

          {cron.lastRun && (
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Última Execução</p>
              <p className="text-sm text-slate-200">
                {new Date(cron.lastRun).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            </div>
          )}

          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">ID</p>
            <p className="text-xs font-mono text-slate-400 break-all">{cron.id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
