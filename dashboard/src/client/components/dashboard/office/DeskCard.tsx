import { Monitor } from './Monitor'
import { AgentAvatar } from './AgentAvatar'

interface Agent {
  id: string
  name: string
  emoji: string
  color: string
  tier: string
  status: 'active' | 'standby' | 'idle'
  lastActivity?: string
  currentTask?: string
}

interface DeskCardProps {
  agent: Agent
}

const tierLabel: Record<string, string> = {
  Top: 'Diretoria',
  Dir: 'Diretor',
  Builder: 'Builder',
  Mkt: 'Marketing',
  Prod: 'Produção',
}

const statusLabel: Record<string, string> = {
  active: 'Trabalhando',
  standby: 'Em espera',
  idle: 'Offline',
}

const statusDot: Record<string, string> = {
  active: 'bg-green-400',
  standby: 'bg-yellow-400',
  idle: 'bg-slate-600',
}

export function DeskCard({ agent }: DeskCardProps) {
  const isActive = agent.status === 'active'
  const isStandby = agent.status === 'standby'

  return (
    <div
      className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-300 cursor-default
        ${isActive
          ? 'bg-slate-900 border-green-800 shadow-[0_0_12px_rgba(74,222,128,0.15)]'
          : isStandby
            ? 'bg-slate-900 border-yellow-900/60'
            : 'bg-slate-950 border-slate-800 opacity-60'
        }`}
    >
      {/* Status indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${statusDot[agent.status]} ${isActive ? 'animate-pulse' : ''}`} />
      </div>

      {/* Desk surface */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        <Monitor active={isActive} standby={isStandby} />
        <AgentAvatar emoji={agent.emoji} name={agent.name} status={agent.status} />
      </div>

      {/* Name + role */}
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-200 leading-none">{agent.name}</p>
        <p className="text-[9px] text-slate-500 mt-0.5">{tierLabel[agent.tier] ?? agent.tier}</p>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 whitespace-nowrap shadow-xl">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot[agent.status]}`} />
            <span className="font-medium">{agent.name}</span>
            <span className="text-slate-400">· {statusLabel[agent.status]}</span>
          </div>
          {agent.currentTask && (
            <p className="text-slate-400 truncate max-w-[200px]">
              📋 {agent.currentTask}
            </p>
          )}
          {agent.lastActivity && (
            <p className="text-slate-500 text-[10px] mt-0.5">
              Última atividade: {new Date(agent.lastActivity).toLocaleTimeString('pt-BR')}
            </p>
          )}
          {!agent.currentTask && !agent.lastActivity && (
            <p className="text-slate-500">Sem atividade recente</p>
          )}
        </div>
        <div className="w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45 mx-auto -mt-1" />
      </div>
    </div>
  )
}
