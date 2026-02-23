import { AGENT_EMOJIS } from '@/shared/types/tasks'
import { SubtaskProgress } from '@/client/components/dashboard/shared/SubtaskProgress'
import { useTaskStore } from '@/client/hooks/useTaskStore'
import { useOrchestrationEvents, type AgentSkillUsage } from '@/client/hooks/useOrchestrationEvents'
import { useState, useEffect } from 'react'
import type { AgentDetail } from '@/server/db/queries'
import type { AgentNode } from '@/shared/types/orchestration'

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

function SkillBadge({ skill, usage }: { skill: string; usage?: AgentSkillUsage }) {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!usage?.lastUsed) {
      setIsActive(false)
      return
    }
    const age = Date.now() - new Date(usage.lastUsed).getTime()
    if (age < 10000) {
      setIsActive(true)
      const t = setTimeout(() => setIsActive(false), 10000 - age)
      return () => clearTimeout(t)
    } else {
      setIsActive(false)
    }
  }, [usage?.lastUsed])

  if (isActive) {
    return (
      <span className="bg-blue-100 text-blue-700 animate-pulse px-1.5 py-0.5 rounded-full text-[9px] font-medium border border-blue-200" title="Ativa agora">
        {skill} {usage?.count ? `(${usage.count})` : ''}
      </span>
    )
  }

  const isIdle = (usage?.count ?? 0) > 0
  return (
    <span 
      className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium border transition-colors ${
        isIdle 
          ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600' 
          : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
      }`}
      title={isIdle ? 'Idle' : 'Disponível'}
    >
      {skill} {isIdle ? `(${usage?.count ?? 0})` : ''}
    </span>
  )
}

export function AgentCard({ agent, hierarchyNode }: { agent: AgentDetail; hierarchyNode?: AgentNode }) {
  const cfg   = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle
  const emoji = AGENT_EMOJIS?.[agent.name] ?? '🤖'

  const currentTaskFull = useTaskStore((s) =>
    agent.currentTask ? s.tasks.find((t) => t.id === agent.currentTask?.id) : null
  )

  const { liveAgentMap } = useOrchestrationEvents()
  const gatewayId = agent.name === 'laura' ? 'main' : agent.name
  const targetId = hierarchyNode?.id ?? gatewayId
  const liveState = liveAgentMap.get(targetId)
  
  const totalTasks = Object.values(agent.counts).reduce((a: number, b) => a + (b ?? 0), 0)
  const skills = hierarchyNode?.skills ?? []
  
  const [skillsExpanded, setSkillsExpanded] = useState(false)

  return (
    <div className={`rounded-xl border-2 p-4 flex flex-col gap-3 transition-all ${cfg.border} ${cfg.bg} dark:bg-slate-800/60 dark:border-slate-700 min-h-[180px]`}>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">@{agent.name}</span>
          </div>
          {hierarchyNode && (
            <div className="mt-1 flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]" title={hierarchyNode.role}>
                {hierarchyNode.role}
              </span>
              {hierarchyNode.reportsTo && (
                <span className="text-[9px] text-slate-400 bg-white/50 px-1.5 py-0.5 rounded-full w-fit">
                  ↳ Reporta a: @{hierarchyNode.reportsTo}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{cfg.label}</span>
        </div>
      </div>

      {/* Task atual ou Live Action */}
      {agent.currentTask ? (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Trabalhando em</p>
          <p className="text-sm text-slate-700 dark:text-slate-200 font-medium line-clamp-2">
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
          <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-white/60 dark:bg-slate-700/50 px-1.5 py-0.5 rounded w-fit">
            Fase {agent.currentTask.phase}
          </span>
        </div>
      ) : liveState?.currentAction ? (
        <div className="flex flex-col gap-1 bg-white/50 p-2 rounded border border-slate-100">
           <p className="text-[10px] text-blue-500 uppercase tracking-wide flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Live Action
           </p>
           <p className="text-xs text-slate-600 font-medium italic">
             "{liveState.currentAction}"
           </p>
        </div>
      ) : (
        <p className="text-xs text-slate-400 dark:text-slate-500 flex-1 flex items-center">
          {agent.status === 'blocked' ? '⛔ Task bloqueada' : 'Sem tasks ativas'}
        </p>
      )}

      {/* Skills Section */}
      {skills.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-auto">
          <button 
            onClick={() => setSkillsExpanded(!skillsExpanded)}
            className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <span>Skills ({skills.length})</span>
            <span className="text-xs">{skillsExpanded ? '▲' : '▼'}</span>
          </button>
          
          {skillsExpanded && (
            <div className="flex flex-wrap gap-1 mt-1">
              {skills.map(s => (
                <SkillBadge 
                  key={s} 
                  skill={s} 
                  usage={liveState?.skillsActive?.[s]} 
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          {totalTasks} task{totalTasks !== 1 ? 's' : ''} total
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          ⏱ {timeAgo(agent.lastActive)}
        </span>
      </div>
    </div>
  )
}
