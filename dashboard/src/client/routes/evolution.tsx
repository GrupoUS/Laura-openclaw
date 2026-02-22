import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '../trpc'

export const Route = createFileRoute('/evolution')({
  component: Evolution,
})

interface MemoryRecord {
  id: string
  content: string
  category: string
  source: string
  score: number | null
  similarity?: number
  createdAt: string | null
}

interface CycleRecord {
  id: string
  trigger: string
  status: string
  memoriesCreated: number | null
  durationMs: number | null
  createdAt: string | null
}

function Evolution() {
  const statsQuery = trpc.evolution.stats.useQuery()
  const memoriesQuery = trpc.evolution.memories.list.useQuery()
  const cyclesQuery = trpc.evolution.cycles.list.useQuery()
  const triggerMutation = trpc.evolution.cycles.trigger.useMutation()

  const [searchQuery, setSearchQuery] = useState('')
  const searchResults = trpc.evolution.memories.search.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length > 2 }
  )

  const categoryColors: Record<string, string> = {
    lesson: 'bg-blue-900/40 text-blue-400 border-blue-800',
    pattern: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    correction: 'bg-amber-900/40 text-amber-400 border-amber-800',
    decision: 'bg-violet-900/40 text-violet-400 border-violet-800',
    preference: 'bg-cyan-900/40 text-cyan-400 border-cyan-800',
    gotcha: 'bg-red-900/40 text-red-400 border-red-800',
  }

  const statusColors: Record<string, string> = {
    success: 'bg-green-900/40 text-green-400 border-green-800',
    failed: 'bg-red-900/40 text-red-400 border-red-800',
    running: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
    skipped: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            🧬 Evolution Engine
          </h2>
          <p className="text-neutral-400">
            Autonomous learning, memory, and self-improvement.
          </p>
        </div>
        <button
          onClick={() => triggerMutation.mutate({ trigger: 'manual' })}
          disabled={triggerMutation.isPending}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-medium transition-colors"
        >
          {triggerMutation.isPending ? '⏳ Running…' : '⚡ Trigger Evolution'}
        </button>
      </div>

      {/* Trigger result banner */}
      {triggerMutation.data && (
        <div
          className={`p-4 rounded-lg border ${
            triggerMutation.data.status === 'success'
              ? 'bg-green-900/20 border-green-800 text-green-300'
              : triggerMutation.data.status === 'skipped'
                ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                : 'bg-red-900/20 border-red-800 text-red-300'
          }`}
        >
          <strong>Cycle {triggerMutation.data.cycleId.slice(0, 8)}</strong> — {triggerMutation.data.status} · {triggerMutation.data.memoriesCreated} memories stored · {triggerMutation.data.durationMs}ms
        </div>
      )}

      {/* Stats Cards */}
      {statsQuery.data && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Memories"
            value={statsQuery.data.memories.total}
            icon="🧠"
          />
          <StatCard
            label="Evolution Cycles"
            value={statsQuery.data.cycles.total}
            icon="🔄"
          />
          <StatCard
            label="Successful"
            value={statsQuery.data.cycles.successful}
            icon="✅"
          />
          <StatCard
            label="Top Capabilities"
            value={statsQuery.data.topCapabilities.length}
            icon="💎"
          />
        </div>
      )}

      {/* Memory Distribution */}
      {statsQuery.data && (
        <div className="bg-neutral-950 rounded-lg border border-neutral-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Memory Distribution</h3>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(statsQuery.data.memories.byCategory).map(
              ([cat, count]) => (
                <span
                  key={cat}
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border ${categoryColors[cat] || 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}
                >
                  {cat}: {count}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* Semantic Search */}
      <div className="bg-neutral-950 rounded-lg border border-neutral-800 p-6">
        <h3 className="text-lg font-semibold mb-4">🔍 Semantic Memory Search</h3>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search memories semantically… (min 3 chars)"
          className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        {searchResults.data && searchResults.data.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {searchResults.data.map((m: MemoryRecord) => (
              <div
                key={m.id}
                className="flex items-start gap-3 p-3 bg-neutral-900 rounded-lg border border-neutral-800"
              >
                <span
                  className={`shrink-0 inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${categoryColors[m.category] || ''}`}
                >
                  {m.category}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-200 break-words">{m.content}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Similarity: {((m.similarity ?? 0) * 100).toFixed(1)}% · Source: {m.source}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {searchResults.data && searchResults.data.length === 0 && searchQuery.length > 2 && (
          <p className="mt-3 text-neutral-500 text-sm">No memories found matching your query.</p>
        )}
      </div>

      {/* Recent Evolution Cycles */}
      <div className="bg-neutral-950 rounded-lg border border-neutral-800 shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-800">
          <h3 className="text-lg font-semibold">Recent Evolution Cycles</h3>
        </div>
        {cyclesQuery.isLoading ? (
          <div className="p-8 text-center text-neutral-500">Loading cycles…</div>
        ) : cyclesQuery.isError ? (
          <div className="p-8 text-center text-red-500">
            Failed to load: {cyclesQuery.error.message}
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Cycle ID</th>
                <th className="px-6 py-4 font-medium">Trigger</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Memories</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {(cyclesQuery.data as CycleRecord[])?.length ? (
                (cyclesQuery.data as CycleRecord[]).map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-900/50">
                    <td className="px-6 py-4 font-mono text-xs">
                      {c.id?.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 capitalize">{c.trigger}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColors[c.status] || ''}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{c.memoriesCreated ?? 0}</td>
                    <td className="px-6 py-4">
                      {c.durationMs ? `${c.durationMs}ms` : '—'}
                    </td>
                    <td className="px-6 py-4 text-neutral-400 text-xs">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                    No evolution cycles yet. Click "Trigger Evolution" to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Memories */}
      <div className="bg-neutral-950 rounded-lg border border-neutral-800 shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-800">
          <h3 className="text-lg font-semibold">Recent Memories</h3>
        </div>
        {memoriesQuery.isLoading ? (
          <div className="p-8 text-center text-neutral-500">Loading memories…</div>
        ) : memoriesQuery.isError ? (
          <div className="p-8 text-center text-red-500">
            Failed to load: {memoriesQuery.error.message}
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {(memoriesQuery.data as MemoryRecord[])?.length ? (
              (memoriesQuery.data as MemoryRecord[]).slice(0, 20).map((m) => (
                <div
                  key={m.id}
                  className="px-6 py-4 flex items-start gap-3 hover:bg-neutral-900/50"
                >
                  <span
                    className={`shrink-0 inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${categoryColors[m.category] || ''}`}
                  >
                    {m.category}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-200 break-words">{m.content}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Score: {m.score ?? 0} · {m.source} · {m.createdAt
                        ? new Date(m.createdAt).toLocaleDateString()
                        : ''}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-neutral-500">
                No memories stored yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: string
}) {
  return (
    <div className="bg-neutral-950 rounded-lg border border-neutral-800 p-5">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-neutral-400 text-sm">{label}</span>
      </div>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
    </div>
  )
}
