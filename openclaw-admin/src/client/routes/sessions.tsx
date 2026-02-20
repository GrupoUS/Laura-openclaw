import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '../trpc'

export const Route = createFileRoute('/sessions')({
  component: Sessions
})

function Sessions() {
  const sessionsQuery = trpc.sessions.list.useQuery()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Active Sessions</h2>
          <p className="text-neutral-400">Manage real-time conversations.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors">
          Spawn Agent
        </button>
      </div>

      <div className="bg-neutral-950 rounded-lg border border-neutral-800 shadow-md overflow-hidden">
        {sessionsQuery.isLoading ? (
          <div className="p-8 text-center text-neutral-500">Loading sessions...</div>
        ) : sessionsQuery.isError ? (
          <div className="p-8 text-center text-red-500">Failed to load sessions: {sessionsQuery.error.message}</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Session ID</th>
                <th className="px-6 py-4 font-medium">Agent</th>
                <th className="px-6 py-4 font-medium">Channel</th>
                <th className="px-6 py-4 font-medium">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {(sessionsQuery.data as any[])?.length ? (
                (sessionsQuery.data as any[]).map((s: any, i) => (
                  <tr key={i} className="hover:bg-neutral-900/50">
                    <td className="px-6 py-4 font-mono">{s.id || s.sessionId}</td>
                    <td className="px-6 py-4">{s.agentId}</td>
                    <td className="px-6 py-4">{s.channelId}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-400 border border-green-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                    No active sessions found.
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
