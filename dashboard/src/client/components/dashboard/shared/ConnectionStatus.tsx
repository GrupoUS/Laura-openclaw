
import { useTaskStore } from '@/client/hooks/useTaskStore'

export function ConnectionStatus() {
  const isConnected = useTaskStore((s) => s.isConnected)
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className={`w-2 h-2 rounded-full transition-colors ${
        isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
      }`} />
      <span>{isConnected ? 'Live' : 'Reconectando...'}</span>
    </div>
  )
}
