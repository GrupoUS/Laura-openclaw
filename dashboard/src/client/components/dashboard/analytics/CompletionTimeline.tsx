
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import type { AnalyticsData } from '@/server/db/queries'

export function CompletionTimeline({
  data
}: { data: AnalyticsData['completionTimeline'] }) {
  if (!data.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-center h-[260px]">
        <p className="text-xs text-slate-400 dark:text-slate-500">Nenhuma task concluída nos últimos 14 dias</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
        📅 Conclusões — últimos 14 dias
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--chart-success)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--chart-success)" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="date" tick={{ fill: 'var(--chart-text)', fontSize: 10 }} stroke="var(--chart-grid)" />
          <YAxis tick={{ fill: 'var(--chart-text)', fontSize: 10 }} allowDecimals={false} stroke="var(--chart-grid)" />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgb(15 23 42 / 0.9)', borderColor: 'var(--chart-grid)', color: '#fff', borderRadius: '8px' }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value) => [`${value} tasks`, 'Concluídas']}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--chart-success)"
            strokeWidth={2}
            fill="url(#completionGrad)"
            name="Concluídas"
            dot={{ fill: 'var(--chart-success)', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
