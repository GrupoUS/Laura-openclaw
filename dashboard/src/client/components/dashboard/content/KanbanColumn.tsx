import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ContentCard, type ContentCardData } from './ContentCard'

const STAGE_CONFIG = {
  ideas:     { label: 'Ideias',    icon: '💡', color: 'purple' },
  roteiro:   { label: 'Roteiro',   icon: '✍️', color: 'blue' },
  thumbnail: { label: 'Thumbnail', icon: '🖼️', color: 'yellow' },
  gravacao:  { label: 'Gravação',  icon: '🎬', color: 'orange' },
  edicao:    { label: 'Edição',    icon: '✂️', color: 'red' },
  publicado: { label: 'Publicado', icon: '✅', color: 'green' },
} as const

type Stage = keyof typeof STAGE_CONFIG

const COLOR_CLASSES: Record<string, string> = {
  purple: 'text-purple-400 border-purple-800/50 bg-purple-950/20',
  blue:   'text-blue-400 border-blue-800/50 bg-blue-950/20',
  yellow: 'text-yellow-400 border-yellow-800/50 bg-yellow-950/20',
  orange: 'text-orange-400 border-orange-800/50 bg-orange-950/20',
  red:    'text-red-400 border-red-800/50 bg-red-950/20',
  green:  'text-green-400 border-green-800/50 bg-green-950/20',
}

interface KanbanColumnProps {
  stage: Stage
  cards: ContentCardData[]
  onAddCard: (stage: Stage) => void
}

export function KanbanColumn({ stage, cards, onAddCard }: KanbanColumnProps) {
  const config = STAGE_CONFIG[stage]
  const colorClass = COLOR_CLASSES[config.color]
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div className={`flex flex-col rounded-xl border ${colorClass} min-w-[240px] w-[240px] shrink-0`}>
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{config.icon}</span>
          <span className="text-xs font-semibold tracking-wide">{config.label}</span>
        </div>
        <span className="text-xs font-bold bg-slate-800/60 rounded-full w-5 h-5 flex items-center justify-center">
          {cards.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 p-2 flex-1 min-h-[120px] rounded-lg mx-2 mb-1 transition-colors ${
          isOver ? 'bg-slate-700/30' : ''
        }`}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <ContentCard key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>

      {/* Add card button */}
      <button
        onClick={() => onAddCard(stage)}
        className="mx-2 mb-2 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-slate-700 text-xs text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors"
      >
        <span>+</span>
        <span>Adicionar</span>
      </button>
    </div>
  )
}
