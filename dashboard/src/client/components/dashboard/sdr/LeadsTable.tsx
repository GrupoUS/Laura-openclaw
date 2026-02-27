import { useState, useEffect } from 'react'
import { trpc } from '@/client/trpc'

const STATUS_CONFIG: Record<string, { label: string; light: string; dark: string }> = {
  pending:   { label: 'Pendente',   light: 'bg-yellow-100 text-yellow-700', dark: 'dark:bg-yellow-900/30 dark:text-yellow-300' },
  contacted: { label: 'Contatado',  light: 'bg-blue-100 text-blue-700',     dark: 'dark:bg-blue-900/30 dark:text-blue-300' },
  converted: { label: 'Convertido', light: 'bg-green-100 text-green-700',   dark: 'dark:bg-green-900/30 dark:text-green-300' },
  lost:      { label: 'Perdido',    light: 'bg-red-100 text-red-700',       dark: 'dark:bg-red-900/30 dark:text-red-300' },
}

type StatusFilter = 'all' | 'pending' | 'contacted' | 'converted' | 'lost'

export function LeadsTable() {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(0)
  const limit = 20
  const utils = trpc.useUtils()

  const { data, isLoading } = trpc.sdr.recentLeads.useQuery(
    { limit, offset: page * limit, status },
    { refetchInterval: 30_000 }
  )

  // SSE-driven invalidation for new leads/handoffs
  useEffect(() => {
    const types = ['lead_contacted', 'lead_handoff', 'objection_handled']
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { sdrType?: string } | undefined
      if (detail?.sdrType || types.includes((e as CustomEvent).type)) {
        utils.sdr.recentLeads.invalidate()
        utils.sdr.kpis.invalidate()
      }
    }
    // Listen on window for forwarded SSE events
    for (const t of types) {
      window.addEventListener(t, handler)
    }
    window.addEventListener('sdr_generic', handler)
    return () => {
      for (const t of types) {
        window.removeEventListener(t, handler)
      }
      window.removeEventListener('sdr_generic', handler)
    }
  }, [utils])

  const leads = data?.leads ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(0) }}
          className="text-xs border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1.5
                     bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
        >
          <option value="all">Todos</option>
          <option value="pending">Pendente</option>
          <option value="contacted">Contatado</option>
          <option value="converted">Convertido</option>
          <option value="lost">Perdido</option>
        </select>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {total} lead{total !== 1 ? 's' : ''}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4 text-center">
          Nenhum lead encontrado.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs
                             text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <th className="py-2 pr-3">Nome</th>
                <th className="py-2 pr-3">Telefone</th>
                <th className="py-2 pr-3">Produto</th>
                <th className="py-2 pr-3">Closer</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const cfg = STATUS_CONFIG[lead.status ?? 'pending'] ?? STATUS_CONFIG.pending
                return (
                  <tr
                    key={lead.id}
                    className="border-b border-slate-100 dark:border-slate-700/50
                               hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-2.5 pr-3 text-slate-800 dark:text-slate-200 font-medium">
                      {lead.leadName ?? '-'}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300 tabular-nums">
                      {lead.leadPhone}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">
                      {lead.product ?? '-'}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">
                      {lead.closerName ?? '-'}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.light} ${cfg.dark}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400 text-xs tabular-nums">
                      {lead.handoffAt ? new Date(lead.handoffAt).toLocaleDateString('pt-BR') : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600
                       text-slate-700 dark:text-slate-300
                       disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            Anterior
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600
                       text-slate-700 dark:text-slate-300
                       disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
