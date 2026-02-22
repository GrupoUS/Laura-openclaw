import { Link } from '@tanstack/react-router'
import type { AgentNode, AgentStatus } from '@/shared/types/orchestration'

const STATUS_COLORS: Record<AgentStatus, { bg: string; dot: string; border: string }> = {
  active:      { bg: 'bg-emerald-50', dot: 'bg-emerald-400',          border: 'border-emerald-300' },
  idle:        { bg: 'bg-amber-50',   dot: 'bg-amber-400',            border: 'border-amber-300' },
  offline:     { bg: 'bg-slate-50',   dot: 'bg-slate-300',            border: 'border-slate-200' },
  in_workflow: { bg: 'bg-blue-50',    dot: 'bg-blue-400 animate-pulse', border: 'border-blue-300' },
}

const LEVEL_LABELS: Record<number, string> = {
  0: 'Fundador',
  1: 'C-Level',
  2: 'Diretor',
  3: 'Operacional',
}

// Map hierarchy IDs to gateway agent IDs for board linking
const HIERARCHY_TO_GATEWAY: Record<string, string> = {
  laura: 'main',
  coder: 'coder',
  cs: 'cs',
  suporte: 'suporte',
}

function AgentNodeCard({ node }: { node: AgentNode }) {
  const colors = STATUS_COLORS[node.status]
  const gatewayId = HIERARCHY_TO_GATEWAY[node.id]

  return (
    <div
      className={`relative rounded-lg border-2 px-3 py-2 min-w-[140px] max-w-[180px] transition-all hover:shadow-md ${colors.bg} ${colors.border}`}
      title={`${node.name} — ${node.role}\nSkills: ${node.skills.join(', ') || 'nenhuma'}\nStatus: ${node.status}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
        <span className="text-xs font-semibold text-slate-800 truncate">{node.name}</span>
      </div>
      <p className="text-[10px] text-slate-500 leading-tight truncate">{node.role}</p>
      {node.requiredSkill && (
        <span className="mt-1 inline-block text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium truncate max-w-full">
          {node.requiredSkill}
        </span>
      )}
      {node.skills.length > 0 && !node.requiredSkill && (
        <span className="mt-1 inline-block text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
          {node.skills.length} skill{node.skills.length > 1 ? 's' : ''}
        </span>
      )}
      {gatewayId && (
        <Link
          to="/board"
          search={{ agent: gatewayId }}
          className="mt-1.5 block text-[9px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
        >
          Ver tarefas →
        </Link>
      )}
    </div>
  )
}

function ConnectorLine() {
  return (
    <div className="flex justify-center">
      <div className="w-px h-4 bg-slate-300" />
    </div>
  )
}

function HorizontalConnector({ count }: { count: number }) {
  if (count <= 1) return null
  return (
    <div className="relative flex justify-center" style={{ height: 8 }}>
      <div
        className="absolute top-0 h-px bg-slate-300"
        style={{ width: `${Math.min(100, count * 12)}%`, left: `${Math.max(0, 50 - (count * 6))}%` }}
      />
    </div>
  )
}

export function HierarchyTree({ nodes }: { nodes: AgentNode[] }) {
  // Group by level
  const byLevel: Record<number, AgentNode[]> = { 0: [], 1: [], 2: [], 3: [] }
  for (const node of nodes) {
    if (byLevel[node.level]) byLevel[node.level].push(node)
  }

  // Group level 3 by director
  const level3ByDirector: Record<string, AgentNode[]> = {}
  for (const node of byLevel[3]) {
    const dir = node.reportsTo ?? 'unknown'
    if (!level3ByDirector[dir]) level3ByDirector[dir] = []
    level3ByDirector[dir].push(node)
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px] flex flex-col items-center gap-0">
        {/* Level 0 — Fundador */}
        <div>
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">{LEVEL_LABELS[0]}</span>
        </div>
        <div className="flex justify-center">
          {byLevel[0].map((n) => <AgentNodeCard key={n.id} node={n} />)}
        </div>

        <ConnectorLine />

        {/* Level 1 — C-Level */}
        <div>
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">{LEVEL_LABELS[1]}</span>
        </div>
        <HorizontalConnector count={byLevel[1].length} />
        <div className="flex justify-center gap-6 flex-wrap">
          {byLevel[1].map((n) => <AgentNodeCard key={n.id} node={n} />)}
        </div>

        <ConnectorLine />

        {/* Level 2 — Directors */}
        <div>
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">{LEVEL_LABELS[2]}</span>
        </div>
        <HorizontalConnector count={byLevel[2].length} />
        <div className="flex justify-center gap-4 flex-wrap">
          {byLevel[2].map((n) => <AgentNodeCard key={n.id} node={n} />)}
        </div>

        {/* Level 3 — Operational (grouped by director) */}
        {Object.keys(level3ByDirector).length > 0 && (
          <>
            <ConnectorLine />
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">{LEVEL_LABELS[3]}</span>
            </div>
            <div className="flex gap-8 flex-wrap justify-center">
              {Object.entries(level3ByDirector).map(([dirId, agents]) => {
                const director = nodes.find((n) => n.id === dirId)
                return (
                  <div key={dirId} className="flex flex-col items-center gap-1">
                    <span className="text-[9px] text-slate-400 font-medium">
                      ↳ {director?.name ?? dirId}
                    </span>
                    <HorizontalConnector count={agents.length} />
                    <div className="flex gap-2 flex-wrap justify-center">
                      {agents.map((n) => <AgentNodeCard key={n.id} node={n} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 justify-center">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
            <span className="text-[10px] text-slate-500 capitalize">{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
