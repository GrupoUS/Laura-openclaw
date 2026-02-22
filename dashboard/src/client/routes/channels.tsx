import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '../trpc'

export const Route = createFileRoute('/channels')({
  component: Channels
})

function Channels() {
  const channelsQuery = trpc.channels.list.useQuery()

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold tracking-tight">Channels</h2>
      <p className="text-neutral-400">Manage communication channel authentications.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {channelsQuery.isLoading && <div className="text-neutral-500">Loading channels...</div>}
        {channelsQuery.isError && <div className="text-red-500">Error: {channelsQuery.error.message}</div>}
        {channelsQuery.data ? (
          <React.Fragment>
            {(channelsQuery.data as Record<string, unknown>[]).map((channel, i) => {
              const status = (channel.status as string) || 'unknown'
              const statusColor = status === 'connected' ? 'text-green-500'
                : status === 'pending' ? 'text-yellow-500'
                : status === 'disconnected' ? 'text-red-500'
                : 'text-neutral-400'
              return (
                <div key={(channel.id as string) || (channel.name as string) || i} className="bg-neutral-950 p-6 rounded-lg border border-neutral-800 shadow-md">
                  <h3 className="text-xl font-semibold mb-2 text-indigo-400">{(channel.id as string) || (channel.name as string)}</h3>
                  <div className="text-sm text-neutral-400 space-y-1 mb-4">
                    <p>Type: <span className="text-white capitalize">{channel.provider as string}</span></p>
                    <p>Status: <span className={statusColor}>{status}</span></p>
                  </div>
                  <button
                    disabled
                    title="Coming Soon"
                    className="w-full py-2 bg-neutral-900 border border-neutral-700 text-neutral-500 rounded text-sm font-medium opacity-50 cursor-not-allowed"
                  >
                    Reauthorize
                  </button>
                </div>
              )
            })}
          </React.Fragment>
        ) : null}
      </div>
    </div>
  )
}
