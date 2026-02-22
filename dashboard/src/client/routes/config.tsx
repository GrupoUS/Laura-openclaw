import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '../trpc'
import { useState } from 'react'

export const Route = createFileRoute('/config')({
  component: ConfigEditor
})

function ConfigEditor() {
  const [jsonInput, setJsonInput] = useState('{\n  \n}')
  const patchMutation = trpc.gateway.patch.useMutation()

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      patchMutation.mutate({ patch: parsed })
    } catch {
      alert('Invalid JSON')
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Config Editor</h2>
        <p className="text-neutral-400">Apply a JSON patch to the active OpenClaw configuration.</p>
      </div>

      <div className="bg-neutral-950 p-6 rounded-lg border border-neutral-800 shadow-md">
        <textarea
          className="w-full h-64 bg-neutral-900 border border-neutral-700 rounded p-4 text-emerald-400 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          spellCheck={false}
        />

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm">
            {patchMutation.isPending && <span className="text-yellow-500">Applying...</span>}
            {patchMutation.isSuccess && <span className="text-green-500">Patch applied successfully!</span>}
            {patchMutation.isError && <span className="text-red-500">Error: {patchMutation.error.message}</span>}
          </div>
          <button
            onClick={handleApply}
            disabled={patchMutation.isPending}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-medium transition-colors"
          >
            Apply Patch
          </button>
        </div>
      </div>
    </div>
  )
}
