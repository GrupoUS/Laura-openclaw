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

      {providersQuery.isLoading && <div className="bg-neutral-950 p-8 rounded-lg border border-neutral-800 text-neutral-500 text-center">Loading providers...</div>}
      {providersQuery.isError && <div className="bg-neutral-950 p-8 rounded-lg border border-neutral-800 text-red-500 text-center">Error: {providersQuery.error.message}</div>}
      {providersQuery.data ? (
        Array.isArray(providersQuery.data) && providersQuery.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(providersQuery.data as Record<string, unknown>[]).map((provider, i) => (
              <div key={(provider.id as string) || (provider.name as string) || i} className="bg-neutral-950 p-5 rounded-lg border border-neutral-800 shadow-md">
                <h3 className="text-base font-semibold text-indigo-400 mb-1">{(provider.name as string) || (provider.id as string) || `Provider ${i + 1}`}</h3>
                <div className="text-sm text-neutral-400 space-y-1">
                  {typeof provider.type === 'string' && <p>Type: <span className="text-white capitalize">{provider.type}</span></p>}
                  {typeof provider.model === 'string' && <p>Model: <span className="text-white font-mono text-xs">{provider.model}</span></p>}
                  {typeof provider.priority === 'number' && <p>Priority: <span className="text-white">{provider.priority}</span></p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-neutral-950 p-8 rounded-lg border border-neutral-800 text-neutral-500 text-center">
            No providers configured. Providers will appear here once set up in the gateway.
          </div>
        )
      ) : null}
    </div>
  )
}
