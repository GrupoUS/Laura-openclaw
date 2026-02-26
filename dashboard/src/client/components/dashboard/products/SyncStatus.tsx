import { useState, useEffect } from 'react'
import { trpc } from '@/client/trpc'

export function SyncStatus() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{ synced: number; total: number; errors: string[] } | null>(null)
  const [diskAvailable, setDiskAvailable] = useState<boolean | null>(null)

  const syncMutation = trpc.products.syncToAgents.useMutation()

  // Check if local disk sync is available
  useEffect(() => {
    fetch('/api/files')
      .then((res) => setDiskAvailable(res.ok))
      .catch(() => setDiskAvailable(false))
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)
    try {
      const res = await syncMutation.mutateAsync()
      setResult({ synced: res.synced, total: res.total, errors: res.errors ?? [] })
    } catch {
      setResult({ synced: 0, total: 0, errors: ['Falha ao sincronizar'] })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="text-xs font-medium px-4 py-1.5 rounded-md bg-emerald-600 text-white
                   disabled:opacity-40 hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
      >
        {syncing ? (
          <>
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Sincronizando...
          </>
        ) : (
          'Sincronizar com Agentes'
        )}
      </button>

      {diskAvailable && (
        <span className="flex items-center gap-1 text-[10px] text-sky-600">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          Sync disco ativo
        </span>
      )}

      {result && (
        <span className={`text-xs ${result.errors.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {result.synced}/{result.total} agentes atualizados
          {result.errors.length > 0 && ` (${result.errors.length} erros)`}
        </span>
      )}
    </div>
  )
}
