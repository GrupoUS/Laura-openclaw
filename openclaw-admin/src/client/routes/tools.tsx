import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '../trpc'

export const Route = createFileRoute('/tools')({
  component: Tools
})

function Tools() {
  const toolsQuery = trpc.tools.list.useQuery()

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold tracking-tight">Tool Policy Manager</h2>
      <p className="text-neutral-400">View tool access policies per provider/agent.</p>

      {toolsQuery.isLoading && <div className="bg-neutral-950 p-8 rounded-lg border border-neutral-800 text-neutral-500 text-center">Loading tools...</div>}
      {toolsQuery.isError && <div className="bg-neutral-950 p-8 rounded-lg border border-neutral-800 text-red-500 text-center">Error: {toolsQuery.error.message}</div>}
      {toolsQuery.data ? (
        Array.isArray(toolsQuery.data) && toolsQuery.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(toolsQuery.data as Record<string, unknown>[]).map((tool, i) => (
              <div key={(tool.id as string) || (tool.name as string) || i} className="bg-neutral-950 p-5 rounded-lg border border-neutral-800 shadow-md">
                <h3 className="text-base font-semibold text-indigo-400 mb-1">{(tool.name as string) || (tool.id as string) || `Tool ${i + 1}`}</h3>
                {typeof tool.description === 'string' && <p className="text-xs text-neutral-500 mb-3">{tool.description}</p>}
                <div className="text-sm text-neutral-400 space-y-1">
                  {typeof tool.type === 'string' && <p>Type: <span className="text-white">{tool.type}</span></p>}
                  {typeof tool.category === 'string' && <p>Category: <span className="text-white">{tool.category}</span></p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-neutral-950 p-8 rounded-lg border border-neutral-800 text-neutral-500 text-center">
            No tools registered. Tools will appear here once configured in the gateway.
          </div>
        )
      ) : null}
    </div>
  )
}
