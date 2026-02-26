import { useState, useEffect } from 'react'
import { trpc } from '@/client/trpc'

interface AgentFile {
  name: string
  path: string
  sizeKb: number
  lastModified: string
}

export function AgentFilesEditor() {
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

  // Auto-select first file
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
      const result = await writeMutation.mutateAsync({
        filePath: activeFile.path,
        content,
      })
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
      {/* Tabs */}
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

      {/* Editor */}
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
