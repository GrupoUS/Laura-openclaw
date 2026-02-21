'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard] Render error:', error.message, error.digest)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-semibold text-slate-800">
          Erro ao carregar a página
        </h2>
        <p className="text-sm text-slate-500">
          Ocorreu um erro no servidor. Verifique os logs do Railway para mais detalhes.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 font-mono">
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-slate-800
                     rounded-md hover:bg-slate-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
