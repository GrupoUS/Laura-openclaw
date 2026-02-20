'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { AGENT_EMOJIS } from '@/types/tasks'
import type { AnalyticsData } from '@/lib/db/queries'

export function AgentVelocityChart({
  data
}: { data: AnalyticsData['agentVelocity'] }) {
  if (!data.length) return null
  const chartData = data.map((d) => ({
    ...d,
    label: `${AGENT_EMOJIS[d.agent as keyof typeof AGENT_EMOJIS] ?? '🤖'} ${d.agent}`,
  }))

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        🤖 Velocity por Agente
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-10} textAnchor="end" />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="done"   fill="#22c55e" name="Concluídas" radius={[4,4,0,0]} />
          <Bar dataKey="active" fill="#3b82f6" name="Em progresso" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
