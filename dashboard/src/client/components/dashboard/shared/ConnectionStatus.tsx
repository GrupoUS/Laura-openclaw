
import { useTaskStore } from '@/client/hooks/useTaskStore'
import { SSE_ENABLED } from '@/client/hooks/useTaskEvents'

export function ConnectionStatus() {
  const isConnected = useTaskStore((s) => s.isConnected)

  if (!SSE_ENABLED) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-slate-300" />
        <span>SSE desativado</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className={`w-2 h-2 rounded-full transition-colors ${
        isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
      }`} />
      <span>{isConnected ? 'Live' : 'Reconectando...'}</span>
    </div>
  )
}
