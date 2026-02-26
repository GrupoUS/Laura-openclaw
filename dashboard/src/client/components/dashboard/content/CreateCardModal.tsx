import { useState } from 'react'
import { trpc } from '@/client/trpc'

const STAGES = ['ideas', 'roteiro', 'thumbnail', 'gravacao', 'edicao', 'publicado'] as const
type Stage = typeof STAGES[number]

const STAGE_LABELS: Record<Stage, string> = {
  ideas:      '💡 Ideias',
  roteiro:    '✍️ Roteiro',
  thumbnail:  '🖼️ Thumbnail',
  gravacao:   '🎬 Gravação',
  edicao:     '✂️ Edição',
  publicado:  '✅ Publicado',
}

interface CreateCardModalProps {
  defaultStage: Stage
  onClose: () => void
}

export function CreateCardModal({ defaultStage, onClose }: CreateCardModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [stage, setStage] = useState<Stage>(defaultStage)

  const utils = trpc.useUtils()
  const createMutation = trpc.content.create.useMutation({
    onSuccess: () => {
      void utils.content.list.invalidate()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    createMutation.mutate({ title: title.trim(), description: description.trim() || undefined, stage })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="text-base font-semibold text-slate-100">Novo Card</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div>
            <label htmlFor="card-title" className="text-xs font-medium text-slate-400 mb-1.5 block">Título *</label>
            <input
              id="card-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Ex: Tutorial sobre React 19..."
            />
          </div>

          <div>
            <label htmlFor="card-description" className="text-xs font-medium text-slate-400 mb-1.5 block">Descrição</label>
            <textarea
              id="card-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Breve descrição do conteúdo..."
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="card-stage" className="text-xs font-medium text-slate-400 mb-1.5 block">Coluna</label>
            <select
              id="card-stage"
              value={stage}
              onChange={(e) => setStage(e.target.value as Stage)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim() || createMutation.isPending}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {createMutation.isPending ? 'Criando...' : 'Criar Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
