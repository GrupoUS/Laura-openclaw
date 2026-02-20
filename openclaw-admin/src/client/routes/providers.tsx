import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '../trpc'

export const Route = createFileRoute('/providers')({
  component: Providers
})

function Providers() {
  const providersQuery = trpc.providers.list.useQuery()

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold tracking-tight">AI Providers</h2>
      <p className="text-neutral-400">Configure language and image model failover chains.</p>

      <div className="bg-neutral-950 p-6 rounded-lg border border-neutral-800 shadow-md">
        {providersQuery.isLoading && <div className="text-neutral-500">Loading providers...</div>}
        {providersQuery.isError && <div className="text-red-500">Error: {providersQuery.error.message}</div>}
        {providersQuery.data ? (
          <React.Fragment>
            <div className="text-neutral-400 text-sm">
              Providers drag-n-drop interface will go here based on config.patch.
            </div>
          </React.Fragment>
        ) : null}
      </div>
    </div>
  )
}
