import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '../trpc'

export const Route = createFileRoute('/tools')({
  component: Tools
})

function Tools() {
  const toolsQuery = trpc.tools.list.useQuery(undefined, { refetchInterval: 30_000 })
  const tools = (toolsQuery.data?.data ?? []) as Record<string, unknown>[]
  const gwConnected = toolsQuery.data?.connected ?? true

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold tracking-tight">Tool Policy Manager</h2>
      <p className="text-neutral-400">View tool access policies per provider/agent.</p>

      {!gwConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm flex items-center gap-2">
          <span>⚠️</span> Gateway offline — dados podem estar desatualizados
        </div>
      )}

      {toolsQuery.isLoading && <div className="bg-neutral-950 p-8 rounded-lg border border-neutral-800 text-neutral-500 text-center">Loading tools...</div>}
      {toolsQuery.isError && <div className="bg-neutral-950 p-8 rounded-lg border border-neutral-800 text-red-500 text-center">Error: {toolsQuery.error.message}</div>}
      {tools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <div key={String(tool.id ?? tool.name ?? crypto.randomUUID())} className="bg-neutral-950 p-5 rounded-lg border border-neutral-800 shadow-md">
              <h3 className="text-base font-semibold text-indigo-400 mb-1">{(tool.name as string) || (tool.id as string) || 'Tool'}</h3>
              {typeof tool.description === 'string' && <p className="text-xs text-neutral-500 mb-3">{tool.description}</p>}
              <div className="text-sm text-neutral-400 space-y-1">
                {typeof tool.type === 'string' && <p>Type: <span className="text-white">{tool.type}</span></p>}
                {typeof tool.category === 'string' && <p>Category: <span className="text-white">{tool.category}</span></p>}
              </div>
            </div>
          ))}
        </div>
      ) : !toolsQuery.isLoading ? (
        <div className="bg-neutral-950 p-8 rounded-lg border border-neutral-800 text-neutral-500 text-center">
          No tools registered. Tools will appear here once configured in the gateway.
        </div>
      ) : null}
    </div>
  )
}
