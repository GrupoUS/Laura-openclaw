import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '../trpc'

export const Route = createFileRoute('/')(  {
  component: Dashboard
})

function Dashboard() {
  // Poll gateway health every 10s
  const healthQuery = trpc.gateway.health.useQuery(undefined, {
    refetchInterval: 10000,
    retry: false
  })

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      {/* Gateway Health Card */}
      <div className="bg-neutral-950 p-6 rounded-lg border border-neutral-800 shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-neutral-300">Gateway Health</h3>

        <div
          className="p-4 rounded border flex items-center justify-between data-[status=ok]:border-green-800/50 data-[status=ok]:bg-green-900/10 data-[status=error]:border-red-800/50 data-[status=error]:bg-red-900/10"
          data-status={healthQuery.isSuccess ? 'ok' : healthQuery.isError ? 'error' : 'loading'}
        >
          <div>
            <div className="font-medium text-neutral-200">
              {healthQuery.isLoading
                ? 'Connecting...'
                : healthQuery.isError
                  ? 'Disconnected'
                  : 'Connected to Gateway'}
            </div>
            <div className="text-sm text-neutral-500 mt-0.5">
              {healthQuery.error?.message || 'WebSocket Online'}
            </div>
          </div>

          <div
            className={`w-3 h-3 rounded-full ${
              healthQuery.isSuccess
                ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                : healthQuery.isError
                  ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                  : 'bg-yellow-500 animate-pulse'
            }`}
          />
        </div>
      </div>

      {/* Raw Health Data */}
      {healthQuery.data ? (
        <div className="bg-neutral-950 p-6 rounded-lg border border-neutral-800 shadow-md overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4 text-neutral-300">Raw Health Data</h3>
          <pre className="text-xs text-neutral-400 bg-neutral-900 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(healthQuery.data, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  )
}
