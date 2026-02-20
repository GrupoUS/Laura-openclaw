'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { AnalyticsData } from '@/lib/db/queries'

const COLORS = {
  done:        '#22c55e',
  in_progress: '#3b82f6',
  blocked:     '#ef4444',
  backlog:     '#d1d5db',
}

export function PhaseProgressChart({
  data
}: { data: AnalyticsData['phaseProgress'] }) {
  if (!data.length) return <EmptyState />
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        📈 Progresso por Fase
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11 }}
            width={55}
          />
          <Tooltip
            formatter={(value, name) => [value, name.toString().replace('_', ' ')]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
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
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-center h-[260px]">
      <p className="text-xs text-slate-400">Sem dados de fases ainda</p>
    </div>
  )
}
