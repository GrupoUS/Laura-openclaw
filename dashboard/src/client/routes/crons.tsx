import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '../trpc'

export const Route = createFileRoute('/crons')({
  component: Crons
})

function Crons() {
  const cronsQuery = trpc.crons.list.useQuery(undefined, { refetchInterval: 30_000 })
  const crons = (cronsQuery.data?.data ?? []) as Record<string, unknown>[]
  const gwConnected = cronsQuery.data?.connected ?? true

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cron Jobs</h2>
          <p className="text-neutral-400">Manage scheduled gateway tasks.</p>
        </div>
        <button
          disabled
          title="Coming Soon"
          className="px-4 py-2 bg-indigo-600/50 text-white/60 rounded font-medium cursor-not-allowed"
        >
          Add Cron Job
        </button>
      </div>

      {!gwConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm flex items-center gap-2">
          <span>⚠️</span> Gateway offline — dados podem estar desatualizados
        </div>
      )}

      <div className="bg-neutral-950 rounded-lg border border-neutral-800 shadow-md overflow-hidden">
        {cronsQuery.isLoading ? (
          <div className="p-8 text-center text-neutral-500">Loading crons...</div>
        ) : cronsQuery.isError ? (
          <div className="p-8 text-center text-red-500">Failed to load crons: {cronsQuery.error.message}</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Cron ID</th>
                <th className="px-6 py-4 font-medium">Schedule</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {crons.length ? (
                crons.map((c) => (
                  <tr key={String(c.id ?? crypto.randomUUID())} className="hover:bg-neutral-900/50">
                    <td className="px-6 py-4 font-mono">{c.id as string}</td>
                    <td className="px-6 py-4 font-mono text-indigo-300">{c.schedule as string}</td>
                    <td className="px-6 py-4 truncate max-w-xs">{(c.action as string) || 'Unknown Action'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${c.active !== false ? 'bg-green-900/40 text-green-400 border border-green-800' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'}`}>
                        {c.active !== false ? 'Active' : 'Paused'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                    No cron jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
