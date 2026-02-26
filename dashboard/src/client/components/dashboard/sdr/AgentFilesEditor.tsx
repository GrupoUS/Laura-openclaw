import { useState, useEffect } from 'react'
import { useFileSync } from '@/client/hooks/useFileSync'
import { trpc } from '@/client/trpc'

interface LocalFile {
  name: string
  sizeKb: number
  lastModified: string
}

// NeonDB fallback types
interface AgentFile {
  name: string
  path: string
  sizeKb: number
  lastModified: string
}

function LocalFileSyncEditor({ fileName }: { fileName: string }) {
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
    return <p className="text-sm text-red-500">Erro: {error}</p>
  }

  return (
    <>
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setSaveMsg(null) }}
        className="w-full h-80 font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg p-4 resize-y
                   focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
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
            <span className="text-xs text-green-600">{saveMsg}</span>
          )}
          {error && (
            <span className="text-xs text-red-500">Erro: {error}</span>
          )}
          {flashLive && (
            <span className="text-xs text-sky-500 animate-pulse">Atualizado pelo disco</span>
          )}
        </div>
        {lastUpdated && (
          <span className="text-xs text-slate-400">
            {new Date(lastUpdated).toLocaleString('pt-BR')}
          </span>
        )}
      </div>
    </>
  )
}

function NeonDbFallbackEditor() {
  const { data: files, isLoading } = trpc.sdr.agentFiles.useQuery(undefined, {
    staleTime: 60_000,
  })
  const [activeFile, setActiveFile] = useState<AgentFile | null>(null)
  const [content, setContent] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const fileQuery = trpc.sdr.readFile.useQuery(
    { filePath: activeFile?.path ?? '' },
    { enabled: !!activeFile, staleTime: 0 }
  )
  const writeMutation = trpc.sdr.writeFile.useMutation()

  useEffect(() => {
    if (fileQuery.data?.content !== null && fileQuery.data?.content !== undefined) {
      setContent(fileQuery.data.content)
      setDirty(false)
      setSaveMsg(null)
    }
  }, [fileQuery.data?.content])

  useEffect(() => {
    if (files && files.length > 0 && !activeFile) {
      setActiveFile(files[0])
    }
  }, [files, activeFile])

  const handleSave = async () => {
    if (!activeFile) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const result = await writeMutation.mutateAsync({ filePath: activeFile.path, content })
      if (result.success) {
        setDirty(false)
        setSaveMsg('Salvo!')
        setTimeout(() => setSaveMsg(null), 2000)
      } else {
        setSaveMsg(`Erro: ${result.error}`)
      }
    } catch (err) {
      setSaveMsg(`Erro: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!files || files.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic">
        Nenhum arquivo encontrado. Defina SDR_AGENT_DIR nas variáveis de ambiente.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-2">
        {files.map((f) => (
          <button
            key={f.path}
            onClick={() => { setActiveFile(f); setDirty(false); setSaveMsg(null) }}
            className={`text-xs px-3 py-1.5 rounded-t-md transition-colors ${
              activeFile?.path === f.path
                ? 'bg-white border border-b-0 border-slate-200 text-slate-900 font-medium -mb-px'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      {fileQuery.isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : fileQuery.data?.error ? (
        <p className="text-sm text-red-500">{fileQuery.data.error}</p>
      ) : (
        <>
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setDirty(true); setSaveMsg(null) }}
            className="w-full h-80 font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg p-4 resize-y
                       focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
            spellCheck={false}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className="text-xs font-medium px-4 py-1.5 rounded-md bg-indigo-600 text-white
                           disabled:opacity-40 hover:bg-indigo-700 transition-colors"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              {saveMsg && (
                <span className={`text-xs ${saveMsg.startsWith('Erro') ? 'text-red-500' : 'text-green-600'}`}>
                  {saveMsg}
                </span>
              )}
            </div>
            {activeFile && (
              <span className="text-xs text-slate-400">
                {activeFile.sizeKb} KB · {new Date(activeFile.lastModified).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function AgentFilesEditor() {
  const [mode, setMode] = useState<'local' | 'neondb' | 'loading'>('loading')
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([])
  const [activeFile, setActiveFile] = useState<string | null>(null)

  // Check if local file sync is available
  useEffect(() => {
    fetch('/api/files')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          if (data.files?.length > 0) {
            setLocalFiles(data.files)
            setActiveFile(data.files[0].name)
            setMode('local')
            return
          }
        }
        setMode('neondb')
      })
      .catch(() => setMode('neondb'))
  }, [])

  if (mode === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (mode === 'neondb') {
    return <NeonDbFallbackEditor />
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-2">
        {localFiles.map((f) => (
          <button
            key={f.name}
            onClick={() => setActiveFile(f.name)}
            className={`text-xs px-3 py-1.5 rounded-t-md transition-colors ${
              activeFile === f.name
                ? 'bg-white border border-b-0 border-slate-200 text-slate-900 font-medium -mb-px'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {f.name}.md
          </button>
        ))}
      </div>

      {/* Editor */}
      {activeFile && <LocalFileSyncEditor key={activeFile} fileName={activeFile} />}
    </div>
  )
}
