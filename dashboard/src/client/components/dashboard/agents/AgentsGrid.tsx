
import { useEffect, useMemo, useState } from 'react'
import { AgentCard } from './AgentCard'
import { ActivityFeed } from './ActivityFeed'
import { ConnectionStatus } from '@/client/components/dashboard/shared/ConnectionStatus'
import { useTaskStore, type ActivityEntry } from '@/client/hooks/useTaskStore'
import type { AgentDetail } from '@/server/db/queries'
import type { Task } from '@/shared/types/tasks'
import type { AgentNode } from '@/shared/types/orchestration'

interface Props {
  initialAgents:    AgentDetail[]
  initialTasks:     Task[]
  initialActivity:  ActivityEntry[]
  hierarchy:        AgentNode[]
}

// Mapeamento visual para ordem das colunas
const STATUS_ORDER: Record<string, number> = {
  doing: 0, active: 1, blocked: 2, idle: 3
}

export function AgentsGrid({ initialAgents, initialTasks, initialActivity, hierarchy }: Props) {
  const [search, setSearch] = useState('')
  const setTasks = useTaskStore((s) => s.setTasks)
  const setAgentDetails = useTaskStore((s) => s.setAgentDetails)

  // Hidratar store
  useEffect(() => {
    setTasks(initialTasks)
    setAgentDetails(initialAgents)
  }, [initialTasks, initialAgents, setTasks, setAgentDetails])

  const agentDetails = useTaskStore((s) => s.agentDetails)
  const agents = useMemo(
    () => {
      let list = agentDetails
      if (search.trim()) {
        const q = search.toLowerCase()
        list = list.filter((a) => {
          if (a.name.toLowerCase().includes(q)) return true
          const mappedId = a.name === 'laura' ? 'main' : a.name
          const node = hierarchy.find((n) => n.id === a.name || n.id === mappedId)
          if (node?.skills.some((s) => s.toLowerCase().includes(q))) return true
          return false
        })
      }
      return list.toSorted(
        (a, b) => (STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4)
      )
    },
    [agentDetails, search, hierarchy]
  )

  const activeCount = agents.filter((a) => a.status === 'doing' || a.status === 'active').length

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-slate-900 shrink-0">🤖 Agentes</h1>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
            {agents.length} agentes · {activeCount} ativo{activeCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex-1 max-w-sm">
          <input 
            type="search"
            placeholder="Buscar por nome ou skill..."
            className="w-full h-8 text-xs border border-slate-200 rounded px-3 focus:ring-1 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                <AgentCard 
                  key={agent.name} 
                  agent={agent} 
                  hierarchyNode={hierarchy.find((n) => n.id === agent.name || n.id === (agent.name === 'laura' ? 'main' : agent.name))}
                />
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
