import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { trpc } from '@/client/trpc'
import { ScriptEditor } from './ScriptEditor'

export interface ContentCardData {
  id: number
  title: string
  description?: string | null
  script?: string | null
  stage: string
  position?: number | null
  assignedTo?: string | null
  thumbnailUrl?: string | null
  videoUrl?: string | null
  publishedUrl?: string | null
  tags?: string[] | null
  createdBy: string
  createdAt: Date | string
  updatedAt: Date | string
}

interface ContentCardProps {
  card: ContentCardData
}

export function ContentCard({ card }: ContentCardProps) {
  const [script, setScript] = useState(card.script ?? '')
  const [expanded, setExpanded] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const utils = trpc.useUtils()
  const updateMutation = trpc.content.update.useMutation({
    onSuccess: () => void utils.content.list.invalidate(),
  })
  const deleteMutation = trpc.content.delete.useMutation({
    onSuccess: () => void utils.content.list.invalidate(),
  })

  const handleSaveScript = () => {
    updateMutation.mutate({ id: card.id, script })
  }

  const isAI = card.createdBy !== 'main' && card.createdBy !== 'mauricio'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-sm hover:border-slate-600 transition-colors"
    >
      {/* Drag handle header */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-start justify-between px-3 pt-3 pb-2 cursor-grab active:cursor-grabbing"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isAI && (
              <span className="text-[9px] px-1.5 py-0.5 bg-indigo-900/60 text-indigo-300 border border-indigo-700 rounded-full font-medium">
                ✨ AI
              </span>
            )}
            {(card.tags ?? []).slice(0, 2).map((tag) => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="text-sm font-medium text-slate-100 mt-1 leading-snug text-left hover:text-indigo-300 transition-colors w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {card.title}
          </button>
        </div>
        <button
          onClick={() => {
            if (confirm('Excluir este card?')) {
              deleteMutation.mutate({ id: card.id })
            }
          }}
          className="text-slate-600 hover:text-red-400 transition-colors ml-2 shrink-0 text-xs"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {card.description && (
            <p className="text-xs text-slate-400 leading-relaxed">{card.description}</p>
          )}

          <ScriptEditor
            script={script}
            onChange={setScript}
            onSave={handleSaveScript}
          />

          {card.publishedUrl && (
            <a
              href={card.publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:underline truncate block"
            >
              🔗 {card.publishedUrl}
            </a>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-slate-700/60">
        <span className="text-[10px] text-slate-500">
          {card.createdBy === 'main' ? '👑 Laura' : card.createdBy === 'mauricio' ? '👤 Maurício' : `🤖 ${card.createdBy}`}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          {expanded ? '▲ fechar' : '▼ ver mais'}
        </button>
      </div>
    </div>
  )
}
