import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '../trpc'

export const Route = createFileRoute('/agents')({
  component: Agents
})

function Agents() {
  const agentsQuery = trpc.agents.list.useQuery()

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold tracking-tight">Active Agents</h2>
      <p className="text-neutral-400">Manage agents and their allowlists.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {agentsQuery.isLoading && <div className="text-neutral-500">Loading agents...</div>}
        {agentsQuery.isError && <div className="text-red-500">Error: {agentsQuery.error.message}</div>}
        {agentsQuery.data ? (
          <React.Fragment>
            {(agentsQuery.data as any[]).map((agent: any, i) => (
              <div key={i} className="bg-neutral-950 p-6 rounded-lg border border-neutral-800 shadow-md">
                <h3 className="text-xl font-semibold mb-2 text-indigo-400">{agent.name || agent.id}</h3>
                <div className="text-sm text-neutral-400 space-y-1 mb-4">
                  <p>Type: <span className="text-white">{agent.type || 'Standard'}</span></p>
                  <p>Status: <span className="text-green-500">Online</span></p>
                </div>
                <button className="w-full py-2 bg-neutral-900 border border-neutral-700 hover:border-indigo-500 text-neutral-300 rounded text-sm font-medium transition-colors">
                  Edit Allowlist
                </button>
              </div>
            ))}
          </React.Fragment>
        ) : null}
      </div>
    </div>
  )
}
