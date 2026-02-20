'use client'
import { useTaskStore, type ActivityEntry } from '@/hooks/useTaskStore'
import { AGENT_EMOJIS } from '@/types/tasks'
import { ScrollArea } from '@/components/ui/scroll-area'

const EVENT_ICONS: Record<string, string> = {
  'task:created':    '🆕',
  'task:updated':    '📝',
  'subtask:created': '➕',
  'subtask:updated': '⚡',
}

const STATUS_COLORS: Record<string, string> = {
  done:    'text-green-600',
  doing:   'text-blue-600',
  blocked: 'text-red-600',
  created: 'text-slate-600',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 5)    return 'agora'
  if (s < 60)   return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}min`
  return `${Math.floor(s / 3600)}h`
}

function ActivityItem({ entry }: { entry: ActivityEntry }) {
  const emoji  = AGENT_EMOJIS?.[entry.agent ?? 'system'] ?? '🤖'
  const icon   = EVENT_ICONS[entry.type]   ?? '📌'
  const status = (entry.payload?.status as string) ?? 'created'
  const color  = STATUS_COLORS[status] ?? 'text-slate-600'
  const label  = entry.taskTitle ?? (entry.payload?.title as string) ?? entry.taskId.slice(0, 8)

  return (
    <div className="flex gap-2.5 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-base shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-slate-700">{emoji} @{entry.agent ?? 'system'}</span>
          {status !== 'created' && (
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 ${color}`}>
              → {status}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{label}</p>
      </div>
      <span className="text-[10px] text-slate-400 shrink-0 mt-1">
        {timeAgo(entry.ts)}
      </span>
    </div>
  )
}

export function ActivityFeed({ initialEvents }: { initialEvents: ActivityEntry[] }) {
  // Combinar: eventos SSE em memória (mais recentes) + histórico NeonDB
  const liveEvents = useTaskStore((s) => s.activityLog)

  // Merge: live events first, then historical (no duplicates by ts)
  const liveTimes  = new Set(liveEvents.map((e) => e.ts))
  const historical = initialEvents.filter((e) => !liveTimes.has(e.ts))
  const merged     = [...liveEvents, ...historical].slice(0, 50)

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-700">📡 Atividade</span>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {merged.length}
        </span>
      </div>
      <ScrollArea className="flex-1 px-3">
        {merged.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            Nenhuma atividade ainda.<br />
            <span className="text-[10px]">Events aparecerão aqui em tempo real.</span>
          </p>
        ) : (
          merged.map((entry, i) => <ActivityItem key={`${entry.ts}-${i}`} entry={entry} />)
        )}
      </ScrollArea>
    </div>
  )
}
