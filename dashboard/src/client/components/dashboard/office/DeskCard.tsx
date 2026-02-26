import { useState, useEffect } from 'react'
import { Monitor } from './Monitor'
import { AgentAvatar } from './AgentAvatar'
import { SubtaskProgress } from '@/client/components/dashboard/shared/SubtaskProgress'
import { ActivityFeed } from '@/client/components/dashboard/agents/ActivityFeed'
import type { AgentDetail } from '@/server/db/queries'
import type { AgentNode } from '@/shared/types/orchestration'
import type { LiveAgentState, AgentSkillUsage } from '@/client/hooks/useOrchestrationEvents'
import type { ActivityEntry } from '@/client/hooks/useTaskStore'
import type { Task } from '@/shared/types/tasks'

interface OfficeAgent {
  id: string
  name: string
  emoji: string
  color: string
  tier: string
  status: 'active' | 'standby' | 'idle'
  lastActivity?: string
  currentTask?: string
}

export interface EnrichedAgent {
  office: OfficeAgent
  detail?: AgentDetail
  live?: LiveAgentState
  hierarchy?: AgentNode
}

interface DeskCardProps {
  agent: EnrichedAgent
  tasks: Task[]
  initialActivity: ActivityEntry[]
}

const tierLabel: Record<string, string> = {
  Top: 'Diretoria',
  Dir: 'Diretor',
  Builder: 'Builder',
  Mkt: 'Marketing',
  Prod: 'Producao',
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 5) return 'agora'
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}min`
  return `${Math.floor(s / 3600)}h`
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
    }
    setIsActive(false)
  }, [usage?.lastUsed])

  if (isActive) {
    return (
      <span className="bg-emerald-950 text-emerald-400 animate-pulse px-1.5 py-0.5 rounded text-[8px] font-medium border border-emerald-800">
        {skill} {usage?.count ? `(${usage.count})` : ''}
      </span>
    )
  }

  const isUsed = (usage?.count ?? 0) > 0
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[8px] font-medium border transition-colors ${
        isUsed
          ? 'bg-slate-800 text-slate-400 border-slate-700'
          : 'bg-slate-900 text-slate-500 border-slate-800'
      }`}
    >
      {skill} {isUsed ? `(${usage?.count ?? 0})` : ''}
    </span>
  )
}

export function DeskCard({ agent, tasks, initialActivity }: DeskCardProps) {
  const { office, detail, live, hierarchy } = agent
  const [expanded, setExpanded] = useState(false)

  const isActive = office.status === 'active'
  const isStandby = office.status === 'standby'

  // Determine what to show on the monitor
  const currentAction = live?.currentAction ?? null
  const currentTaskTitle = detail?.currentTask?.title ?? office.currentTask ?? null
  const screenText = currentAction ?? currentTaskTitle ?? null

  // Get current subtask info
  const currentSubtask = detail?.currentSubtask ?? null

  // Find full task for subtask progress
  const currentTaskFull = detail?.currentTask
    ? tasks.find((t) => t.id === detail.currentTask?.id)
    : null

  // Skills from hierarchy
  const skills = hierarchy?.skills ?? []
  const totalTasks = detail
    ? Object.values(detail.counts).reduce((a: number, b) => a + (b ?? 0), 0)
    : 0

  // Time since last activity
  const lastTime = detail?.lastActive ?? office.lastActivity ?? null

  return (
    <div className="flex flex-col">
      {/* Card */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`group relative flex flex-col items-center gap-2 p-3 rounded border transition-all duration-300 cursor-pointer text-left w-[140px]
          ${isActive
            ? 'bg-slate-900 border-emerald-800/60 shadow-[0_0_16px_rgba(16,185,129,0.12)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]'
            : isStandby
              ? 'bg-slate-900 border-amber-900/40 hover:border-amber-800/60'
              : 'bg-slate-950 border-slate-800 opacity-50 hover:opacity-70'
          }`}
      >
        {/* Status dot */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full ${
              isActive ? 'bg-emerald-400 animate-pulse' : isStandby ? 'bg-amber-400' : 'bg-slate-600'
            }`}
          />
        </div>

        {/* Monitor + Avatar */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          <Monitor active={isActive} standby={isStandby} screenText={screenText ?? undefined} />
          <AgentAvatar emoji={office.emoji} name={office.name} status={office.status} />
        </div>

        {/* Name + Role */}
        <div className="text-center w-full">
          <p className="text-xs font-semibold text-slate-200 leading-none truncate">{office.name}</p>
          <p className="text-[9px] text-slate-500 mt-0.5 truncate">
            {hierarchy?.role ?? tierLabel[office.tier] ?? office.tier}
          </p>
        </div>

        {/* Currently doing — visible text under name */}
        {isActive && screenText && (
          <div className="w-full px-1">
            <p className="text-[8px] text-emerald-400/70 truncate text-center leading-tight">
              {screenText}
            </p>
          </div>
        )}

        {/* Time since last activity */}
        <div className="flex items-center justify-between w-full px-1">
          <span className="text-[8px] text-slate-600">
            {totalTasks > 0 ? `${totalTasks} tasks` : ''}
          </span>
          <span className="text-[8px] text-slate-600">
            {timeAgo(lastTime)}
          </span>
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div
          className="border border-slate-800 border-t-0 rounded-b bg-slate-900/80 backdrop-blur-sm w-[320px] -mt-px z-20 relative"
          style={{ marginLeft: '-90px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-3 border-b border-slate-800">
            <span className="text-2xl">{office.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-100">@{office.id}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                    isActive
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : isStandby
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isActive ? 'ATIVO' : isStandby ? 'STANDBY' : 'OFFLINE'}
                </span>
              </div>
              {hierarchy?.role && (
                <p className="text-[10px] text-slate-500 truncate">{hierarchy.role}</p>
              )}
              {hierarchy?.reportsTo && (
                <p className="text-[9px] text-slate-600 mt-0.5">
                  Reporta a: @{hierarchy.reportsTo}
                </p>
              )}
            </div>
          </div>

          {/* Current work */}
          <div className="p-3 border-b border-slate-800">
            {detail?.currentTask ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-medium">
                  Trabalhando em
                </p>
                <p className="text-xs text-slate-200 font-medium leading-snug">
                  {detail.currentTask.title}
                </p>
                {currentSubtask && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <p className="text-[10px] text-emerald-400/80">{currentSubtask.title}</p>
                  </div>
                )}
                {currentTaskFull && (
                  <SubtaskProgress subtasks={currentTaskFull.subtasks} />
                )}
                <span className="text-[9px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded w-fit">
                  Fase {detail.currentTask.phase}
                </span>
              </div>
            ) : live?.currentAction ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] text-emerald-500 uppercase tracking-wider font-medium">
                    Live Action
                  </p>
                </div>
                <p className="text-xs text-slate-300 italic">
                  "{live.currentAction}"
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-600">Sem tasks ativas</p>
            )}
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="p-3 border-b border-slate-800">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-medium mb-2">
                Skills ({skills.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {skills.map((s) => (
                  <SkillBadge
                    key={s}
                    skill={s}
                    usage={live?.skillsActive?.[s]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center justify-between p-3 border-b border-slate-800 text-[10px] text-slate-500">
            <span>{totalTasks} task{totalTasks !== 1 ? 's' : ''} total</span>
            {hierarchy?.manages && hierarchy.manages.length > 0 && (
              <span>Gerencia: {hierarchy.manages.length}</span>
            )}
            <span>{timeAgo(lastTime)}</span>
          </div>

          {/* Agent activity feed */}
          <div className="max-h-[200px] overflow-y-auto">
            <ActivityFeed
              initialEvents={initialActivity}
              filterAgentId={office.id}
              maxHeight={200}
            />
          </div>
        </div>
      )}
    </div>
  )
}
