'use client'
import { AGENT_EMOJIS } from '@/types/tasks'
import { SubtaskProgress } from '@/components/shared/SubtaskProgress'
import { useTaskStore } from '@/hooks/useTaskStore'
import type { AgentDetail } from '@/lib/db/queries'

const STATUS_CONFIG = {
  doing:   { label: '⚡ ATIVO',    dot: 'bg-blue-400 animate-pulse',  border: 'border-blue-300',  bg: 'bg-blue-50'  },
  active:  { label: '● ATIVO',    dot: 'bg-green-400',                border: 'border-green-300', bg: 'bg-green-50' },
  blocked: { label: '🔴 BLOQUEADO', dot: 'bg-red-500',                border: 'border-red-300',   bg: 'bg-red-50'   },
  idle:    { label: '○ IDLE',     dot: 'bg-gray-300',                 border: 'border-gray-200',  bg: 'bg-gray-50'  },
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)   return `há ${s}s`
  if (s < 3600) return `há ${Math.floor(s / 60)}min`
  return `há ${Math.floor(s / 3600)}h`
}

export function AgentCard({ agent }: { agent: AgentDetail }) {
  const cfg   = STATUS_CONFIG[agent.status]
  const emoji = AGENT_EMOJIS?.[agent.name] ?? '🤖'

  // Pegar subtasks da task atual para o progress bar
  const currentTaskFull = useTaskStore((s) =>
    agent.currentTask ? s.tasks.find((t) => t.id === agent.currentTask?.id) : null
  )

  const totalTasks = Object.values(agent.counts).reduce((a: number, b) => a + (b ?? 0), 0)

  return (
    <div className={`rounded-xl border-2 p-4 flex flex-col gap-3 transition-all ${cfg.border} ${cfg.bg} min-h-[180px]`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <span className="font-semibold text-slate-800 text-sm">@{agent.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
          <span className="text-xs font-medium text-slate-600">{cfg.label}</span>
        </div>
      </div>

      {/* Task atual */}
      {agent.currentTask ? (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Trabalhando em</p>
          <p className="text-sm text-slate-700 font-medium line-clamp-2">
            📋 {agent.currentTask.title}
          </p>
          {agent.currentSubtask && (
            <p className="text-xs text-blue-600 flex items-center gap-1">
              <span className="animate-pulse">⚡</span>
              {agent.currentSubtask.title}
            </p>
          )}
          {currentTaskFull && (
            <SubtaskProgress subtasks={currentTaskFull.subtasks} />
          )}
          <span className="text-[10px] text-slate-400 bg-white/60 px-1.5 py-0.5 rounded w-fit">
            Fase {agent.currentTask.phase}
          </span>
        </div>
      ) : (
        <p className="text-xs text-slate-400 flex-1 flex items-center">
          {agent.status === 'blocked' ? '⛔ Task bloqueada' : 'Sem tasks ativas'}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
        <span className="text-[10px] text-slate-400">
          {totalTasks} task{totalTasks !== 1 ? 's' : ''} total
        </span>
        <span className="text-[10px] text-slate-400">
          ⏱ {timeAgo(agent.lastActive)}
        </span>
      </div>
    </div>
  )
}
