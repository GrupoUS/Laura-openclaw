import React from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { trpc } from '../trpc'

export const Route = createLazyFileRoute('/channels')({
  component: Channels,
})

function Channels() {
  const channelsQuery = trpc.channels.list.useQuery(undefined, { refetchInterval: 30_000 })
  const channels = (channelsQuery.data?.data ?? []) as Record<string, unknown>[]
  const gwConnected = channelsQuery.data?.connected ?? true

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold tracking-tight">Channels</h2>
      <p className="text-neutral-400">Manage communication channel authentications.</p>

      {!gwConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm flex items-center gap-2">
          <span>Warning</span> Gateway offline
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {channelsQuery.isLoading && <div className="text-neutral-500">Loading channels...</div>}
        {channelsQuery.isError && <div className="text-red-500">Error: {channelsQuery.error.message}</div>}
        {channels.length > 0 ? (
          <React.Fragment>
            {channels.map((channel) => {
              const status = (channel.status as string) || 'unknown'
              const statusColor = status === 'connected' ? 'text-green-500'
                : status === 'pending' ? 'text-yellow-500'
                : status === 'disconnected' ? 'text-red-500'
                : 'text-neutral-400'
              return (
                <div key={String(channel.id ?? channel.name ?? crypto.randomUUID())} className="bg-neutral-950 p-6 rounded-lg border border-neutral-800 shadow-md">
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
        ) : !channelsQuery.isLoading ? (
          <div className="text-neutral-500">No channels found.</div>
        ) : null}
      </div>
    </div>
  )
}
