import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { TokenCost } from '@/shared/types/orchestration'

const SQUAD_COLORS: Record<string, string> = {
  Marketing:          '#6366f1', // indigo
  'Produto & Tech':   '#8b5cf6', // violet
  Operações:          '#f59e0b', // amber
  'Financeiro & IBI': '#10b981', // emerald
  Comunidade:         '#ec4899', // pink
  Liderança:          '#3b82f6', // blue
  RH:                 '#f97316', // orange
}

export function TokenCosts({ costs, budget }: { costs: TokenCost[]; budget: number }) {
  const total = costs.reduce((sum, c) => sum + c.cost, 0)
  const usedPercent = Math.round((total / budget) * 100)

  const chartData = costs
    .toSorted((a, b) => b.cost - a.cost)
    .map((c) => ({
      name: c.squad,
      cost: c.cost,
      tokens: c.tokens,
      percent: c.budgetPercent,
    }))

  return (
    <div className="flex flex-col gap-4">
      {/* Summary bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-500">Budget utilizado</span>
            <span className={`font-semibold ${usedPercent > 80 ? 'text-red-600' : 'text-slate-700'}`}>
              {usedPercent}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                usedPercent > 80 ? 'bg-red-500' : usedPercent > 60 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, usedPercent)}%` }}
            />
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-slate-800">R$ {total.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] text-slate-400">de R$ {budget.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 10, fill: '#64748b' }}
            />
            <Tooltip
              formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Custo']}
              labelFormatter={(label) => String(label)}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Bar dataKey="cost" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={SQUAD_COLORS[entry.name] ?? '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Token counts */}
      <div className="grid grid-cols-2 gap-2">
        {costs.toSorted((a, b) => b.tokens - a.tokens).slice(0, 4).map((c) => (
          <div key={c.squad} className="bg-slate-50 rounded-lg px-2.5 py-1.5">
            <p className="text-[10px] text-slate-400 truncate">{c.squad}</p>
            <p className="text-xs font-semibold text-slate-700">{(c.tokens / 1_000_000).toFixed(1)}M tokens</p>
          </div>
        ))}
      </div>
    </div>
  )
}
