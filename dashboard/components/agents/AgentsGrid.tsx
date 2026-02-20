'use client'
import { useEffect } from 'react'
import { AgentCard } from './AgentCard'
import { ActivityFeed } from './ActivityFeed'
import { ConnectionStatus } from '@/components/shared/ConnectionStatus'
import { useTaskStore, type ActivityEntry } from '@/hooks/useTaskStore'
import { useTaskEvents } from '@/hooks/useTaskEvents'
import type { AgentDetail } from '@/lib/db/queries'
import type { Task } from '@/types/tasks'

interface Props {
  initialAgents:    AgentDetail[]
  initialTasks:     Task[]
  initialActivity:  ActivityEntry[]
}

// Mapeamento visual para ordem das colunas
const STATUS_ORDER: Record<string, number> = {
  doing: 0, active: 1, blocked: 2, idle: 3
}

export function AgentsGrid({ initialAgents, initialTasks, initialActivity }: Props) {
  const { setTasks, setAgentDetails } = useTaskStore()

  // Hidratar store
  useEffect(() => {
    setTasks(initialTasks)
    setAgentDetails(initialAgents)
  }, [initialTasks, initialAgents, setTasks, setAgentDetails])

  // Conectar SSE
  useTaskEvents()

  const agents = useTaskStore((s) =>
    s.agentDetails.toSorted(
      (a, b) => (STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4)
    )
  )

  const activeCount = agents.filter((a) => a.status === 'doing' || a.status === 'active').length

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-slate-900">🤖 Agentes</h1>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {agents.length} agentes · {activeCount} ativo{activeCount !== 1 ? 's' : ''}
          </span>
        </div>
        <ConnectionStatus />
      </header>

      {/* Body: Grid + Feed */}
      <div className="flex flex-1 overflow-hidden">
        {/* Agent cards grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          {agents.length === 0 ? (
            <div className="text-center text-slate-400 py-16">
              <p className="text-4xl mb-3">🤖</p>
              <p className="text-sm">Nenhum agente registrado.</p>
              <p className="text-xs mt-1">Agents aparecerão aqui quando criarem tarefas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {agents.map((agent) => (
                <AgentCard key={agent.name} agent={agent} />
              ))}
            </div>
          )}
        </div>

        {/* Activity feed (painel lateral direito) */}
        <div className="w-72 shrink-0 border-l border-slate-200 bg-slate-50 flex flex-col overflow-hidden">
          <ActivityFeed initialEvents={initialActivity} />
        </div>
      </div>
    </div>
  )
}
