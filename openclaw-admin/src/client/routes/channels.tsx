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
            {(channelsQuery.data as any[]).map((channel: any, i) => (
              <div key={i} className="bg-neutral-950 p-6 rounded-lg border border-neutral-800 shadow-md">
                <h3 className="text-xl font-semibold mb-2 text-indigo-400">{channel.id || channel.name}</h3>
                <div className="text-sm text-neutral-400 space-y-1 mb-4">
                  <p>Type: <span className="text-white capitalize">{channel.provider}</span></p>
                  <p>Status: <span className="text-yellow-500">Pending</span></p>
                </div>
                <button className="w-full py-2 bg-neutral-900 border border-neutral-700 hover:border-indigo-500 text-neutral-300 rounded text-sm font-medium transition-colors">
                  Reauthorize
                </button>
              </div>
            ))}
          </React.Fragment>
        ) : null}
      </div>
    </div>
  )
}
