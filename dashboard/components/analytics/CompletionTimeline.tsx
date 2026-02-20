'use client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import type { AnalyticsData } from '@/lib/db/queries'

export function CompletionTimeline({
  data
}: { data: AnalyticsData['completionTimeline'] }) {
  if (!data.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-center h-[260px]">
        <p className="text-xs text-slate-400">Nenhuma task concluída nos últimos 14 dias</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        📅 Conclusões — últimos 14 dias
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip
            formatter={(value) => [`${value} tasks`, 'Concluídas']}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#completionGrad)"
            name="Concluídas"
            dot={{ fill: '#22c55e', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
