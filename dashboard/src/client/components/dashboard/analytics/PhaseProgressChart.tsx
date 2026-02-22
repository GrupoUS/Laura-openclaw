
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { AnalyticsData } from '@/server/db/queries'

const COLORS = {
  done:        'var(--chart-success)',
  in_progress: 'var(--chart-primary)',
  blocked:     'var(--chart-danger)',
  backlog:     'var(--chart-neutral)',
}

export function PhaseProgressChart({
  data
}: { data: AnalyticsData['phaseProgress'] }) {
  if (!data.length) return <EmptyState />
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
        📈 Progresso por Fase
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
          <XAxis type="number" tick={{ fill: 'var(--chart-text)', fontSize: 11 }} stroke="var(--chart-grid)" />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: 'var(--chart-text)', fontSize: 11 }}
            stroke="var(--chart-grid)"
            width={55}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgb(15 23 42 / 0.9)', borderColor: 'var(--chart-grid)', color: '#fff', borderRadius: '8px' }}
            itemStyle={{ color: '#e2e8f0' }}
            cursor={{ fill: 'var(--chart-grid)', opacity: 0.4 }}
            formatter={(value, name) => [value, name?.toString().replace('_', ' ') ?? '']}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: 'var(--chart-text)' }} />
          <Bar dataKey="done"        stackId="a" fill={COLORS.done}        name="Concluído"  radius={[0,0,0,0]} />
          <Bar dataKey="in_progress" stackId="a" fill={COLORS.in_progress} name="Em Progresso" />
          <Bar dataKey="blocked"     stackId="a" fill={COLORS.blocked}     name="Bloqueado"  />
          <Bar dataKey="backlog"     stackId="a" fill={COLORS.backlog}     name="Backlog"    radius={[0,4,4,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-center h-[260px]">
      <p className="text-xs text-slate-400 dark:text-slate-500">Sem dados de fases ainda</p>
    </div>
  )
}
