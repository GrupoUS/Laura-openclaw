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
      <p className="text-neutral-400">View and narrow tool access policies per provider/agent.</p>

      <div className="bg-neutral-950 p-6 rounded-lg border border-neutral-800 shadow-md">
        {toolsQuery.isLoading && <div className="text-neutral-500">Loading tools...</div>}
        {toolsQuery.isError && <div className="text-red-500">Error: {toolsQuery.error.message}</div>}
        {toolsQuery.data ? (
          <React.Fragment>
            <div className="text-neutral-400 text-sm">
              Tools listing implementation will go here based on config.patch capabilities.
            </div>
          </React.Fragment>
        ) : null}
      </div>
    </div>
  )
}
