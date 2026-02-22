
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import type { AnalyticsData } from '@/server/db/queries'

const STATUS_FILL: Record<string, string> = {
  done:        'var(--chart-success)',
  in_progress: 'var(--chart-primary)',
  blocked:     'var(--chart-danger)',
  backlog:     'var(--chart-neutral)',
}

export function StatusDonutChart({
  data, total
}: { data: AnalyticsData['statusDist']; total: number }) {
  if (!data.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
        🍩 Distribuição de Status
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            stroke="var(--chart-grid)"
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_FILL[entry.status] ?? 'var(--chart-neutral)'}
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgb(15 23 42 / 0.9)', borderColor: 'var(--chart-grid)', color: '#fff', borderRadius: '8px' }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(v, name) => [`${v} tasks`, name]} 
          />
          <Legend wrapperStyle={{ fontSize: 11, color: 'var(--chart-text)' }} formatter={(v) => v} />
          {/* Label central */}
          <text x="50%" y="47%" textAnchor="middle" fontSize={22} fontWeight="bold" className="fill-slate-800 dark:fill-slate-100">
            {total}
          </text>
          <text x="50%" y="57%" textAnchor="middle" fontSize={10} className="fill-slate-500 dark:fill-slate-400">
            tasks
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
