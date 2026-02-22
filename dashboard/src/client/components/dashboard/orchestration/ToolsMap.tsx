import type { ToolEntry } from '@/shared/types/orchestration'

export function ToolsMap({ tools }: { tools: ToolEntry[] }) {
  if (tools.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-2xl mb-2">🔧</p>
        <p className="text-xs text-slate-400">Nenhuma tool registrada no gateway.</p>
        <p className="text-[10px] text-slate-300 mt-1">Tools aparecerão aqui quando o gateway estiver online.</p>
      </div>
    )
  }

  const unused = tools.filter((t) => t.unused)
  const used = tools.filter((t) => !t.unused)

  return (
    <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto">
      {/* Used tools */}
      {used.length > 0 && (
        <div className="space-y-1.5">
          {used.map((tool) => (
            <div
              key={tool.name}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200"
            >
              <span className="text-xs text-slate-700 font-medium truncate">{tool.name}</span>
              <div className="flex gap-1 shrink-0 ml-2">
                {tool.usedByAgents.slice(0, 4).map((agent) => (
                  <span
                    key={agent}
                    className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium"
                  >
                    {agent}
                  </span>
                ))}
                {tool.usedByAgents.length > 4 && (
                  <span className="text-[9px] text-slate-400">+{tool.usedByAgents.length - 4}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unused tools */}
      {unused.length > 0 && (
        <>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mt-2">
            Não utilizadas ({unused.length})
          </div>
          <div className="space-y-1.5">
            {unused.map((tool) => (
              <div
                key={tool.name}
                className="flex items-center px-3 py-2 rounded-lg bg-amber-50 border border-amber-200"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mr-2" />
                <span className="text-xs text-amber-700 font-medium truncate">{tool.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
