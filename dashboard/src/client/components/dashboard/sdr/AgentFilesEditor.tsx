import { useState, useEffect } from 'react'
import { useFileSync } from '@/client/hooks/useFileSync'
import { trpc } from '@/client/trpc'

function FileSyncEditor({ fileName }: { fileName: string }) {
  const { content, isLoading, lastUpdated, isDirty, isSaving, error, save, setContent } =
    useFileSync(fileName)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [flashLive, setFlashLive] = useState(false)

  // Flash "live" badge on SSE update
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { name: string; source?: string }
      if (detail.name !== fileName || detail.source === 'dashboard') return
      setFlashLive(true)
      const t = setTimeout(() => setFlashLive(false), 2000)
      return () => clearTimeout(t)
    }
    window.addEventListener('file:updated', handler)
    return () => window.removeEventListener('file:updated', handler)
  }, [fileName])

  const handleSave = async () => {
    setSaveMsg(null)
    await save()
    if (!error) {
      setSaveMsg('Salvo!')
      setTimeout(() => setSaveMsg(null), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !content) {
    return <p className="text-sm text-red-500 dark:text-red-400">Erro: {error}</p>
  }

  return (
    <>
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setSaveMsg(null) }}
        className="w-full h-80 font-mono text-sm rounded-lg p-4 resize-y
                   bg-slate-50 dark:bg-slate-900/60
                   border border-slate-200 dark:border-slate-600
                   text-slate-900 dark:text-slate-100
                   placeholder:text-slate-400 dark:placeholder:text-slate-500
                   focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500
                   focus:border-indigo-300 dark:focus:border-indigo-600"
        spellCheck={false}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="text-xs font-medium px-4 py-1.5 rounded-md bg-indigo-600 text-white
                       disabled:opacity-40 hover:bg-indigo-700 transition-colors"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          {saveMsg && (
            <span className="text-xs text-green-600 dark:text-green-400">{saveMsg}</span>
          )}
          {error && (
            <span className="text-xs text-red-500 dark:text-red-400">Erro: {error}</span>
          )}
          {flashLive && (
            <span className="text-xs text-sky-500 dark:text-sky-400 animate-pulse">
              Atualizado pelo agente
            </span>
          )}
        </div>
        {lastUpdated && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {new Date(lastUpdated).toLocaleString('pt-BR')}
          </span>
        )}
      </div>
    </>
  )
}

export function AgentFilesEditor() {
  const { data: files, isLoading } = trpc.files.getAll.useQuery(undefined, {
    staleTime: 60_000,
  })
  const [activeFile, setActiveFile] = useState<string | null>(null)

  // Auto-select first file
  useEffect(() => {
    if (files && files.length > 0 && !activeFile) {
      setActiveFile(files[0].name)
    }
  }, [files, activeFile])

  // Listen for SSE to invalidate file list
  const utils = trpc.useUtils()
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { name?: string; source?: string }
      if (detail.source !== 'dashboard') {
        utils.files.getAll.invalidate()
        if (detail.name) {
          utils.files.get.invalidate({ name: detail.name })
        }
      }
    }
    window.addEventListener('file:updated', handler)
    return () => window.removeEventListener('file:updated', handler)
  }, [utils])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!files || files.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 italic">
        Nenhum arquivo encontrado no NeonDB.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700 pb-2">
        {files.map((f) => (
          <button
            key={f.name}
            onClick={() => setActiveFile(f.name)}
            className={`text-xs px-3 py-1.5 rounded-t-md transition-colors ${
              activeFile === f.name
                ? 'bg-white dark:bg-slate-700 border border-b-0 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-medium -mb-px'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            {f.name}.md
          </button>
        ))}
      </div>

      {/* Editor */}
      {activeFile && <FileSyncEditor key={activeFile} fileName={activeFile} />}
    </div>
  )
}
