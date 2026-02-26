import { useState } from 'react'

interface ScriptEditorProps {
  script?: string
  onChange: (value: string) => void
  onSave: () => void
}

export function ScriptEditor({ script = '', onChange, onSave }: ScriptEditorProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
      >
        <span>✍️ Roteiro {script ? `(${script.length} chars)` : '(vazio)'}</span>
        <span className="text-slate-500">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="flex flex-col">
          <textarea
            value={script}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-900 text-slate-200 text-xs p-3 resize-none focus:outline-none min-h-[120px]"
            placeholder="Escreva o roteiro aqui..."
          />
          <div className="flex justify-end px-3 py-2 bg-slate-800/50 border-t border-slate-700">
            <button
              onClick={onSave}
              className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
