
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { AGENT_EMOJIS } from '@/shared/types/tasks'
import type { AnalyticsData } from '@/server/db/queries'

export function AgentVelocityChart({
  data
}: { data: AnalyticsData['agentVelocity'] }) {
  if (!data.length) return null
  const chartData = data.map((d) => ({
    ...d,
    label: `${AGENT_EMOJIS[d.agent as keyof typeof AGENT_EMOJIS] ?? '🤖'} ${d.agent}`,
  }))

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
        🤖 Velocity por Agente
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="label" tick={{ fill: 'var(--chart-text)', fontSize: 11 }} angle={-10} textAnchor="end" stroke="var(--chart-grid)" />
          <YAxis tick={{ fill: 'var(--chart-text)', fontSize: 11 }} allowDecimals={false} stroke="var(--chart-grid)" />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgb(15 23 42 / 0.9)', borderColor: 'var(--chart-grid)', color: '#fff', borderRadius: '8px' }} 
            itemStyle={{ color: '#e2e8f0' }}
            cursor={{ fill: 'var(--chart-grid)', opacity: 0.4 }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: 'var(--chart-text)' }} />
          <Bar dataKey="done"   fill="var(--chart-success)" name="Concluídas" radius={[4,4,0,0]} />
          <Bar dataKey="active" fill="var(--chart-primary)" name="Em progresso" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
