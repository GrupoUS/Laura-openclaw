'use client'
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import type { AnalyticsData } from '@/lib/db/queries'

const STATUS_FILL: Record<string, string> = {
  done:        '#22c55e',
  in_progress: '#3b82f6',
  blocked:     '#ef4444',
  backlog:     '#d1d5db',
}

export function StatusDonutChart({
  data, total
}: { data: AnalyticsData['statusDist']; total: number }) {
  if (!data.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">
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
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_FILL[entry.status] ?? '#94a3b8'}
              />
            ))}
          </Pie>
          <Tooltip formatter={(v, name) => [`${v} tasks`, name]} />
          <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => v} />
          {/* Label central */}
          <text x="50%" y="47%" textAnchor="middle" fontSize={22} fontWeight="bold" fill="#1e293b">
            {total}
          </text>
          <text x="50%" y="57%" textAnchor="middle" fontSize={10} fill="#94a3b8">
            tasks
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
