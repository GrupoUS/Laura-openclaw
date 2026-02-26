import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { trpc } from '@/client/trpc'
import { KanbanColumn } from '@/client/components/dashboard/content/KanbanColumn'
import { CreateCardModal } from '@/client/components/dashboard/content/CreateCardModal'

export const Route = createLazyFileRoute('/content')({
  component: ContentPage,
})

const STAGES = ['ideas', 'roteiro', 'thumbnail', 'gravacao', 'edicao', 'publicado'] as const
type Stage = typeof STAGES[number]

function ContentPage() {
  const [createStage, setCreateStage] = useState<Stage | null>(null)

  const { data: grouped, isLoading, isError } = trpc.content.list.useQuery(undefined, {
    refetchInterval: 30_000,
  })

  const utils = trpc.useUtils()
  const reorderMutation = trpc.content.reorder.useMutation({
    onSuccess: () => void utils.content.list.invalidate(),
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || !grouped) return

    const cardId = active.id as number

    let newStage: Stage | undefined
    let newPosition = 0

    if (STAGES.includes(over.id as Stage)) {
      newStage = over.id as Stage
      newPosition = (grouped[newStage] ?? []).length
    } else {
      for (const stage of STAGES) {
        const col = grouped[stage] ?? []
        const idx = col.findIndex((c) => c.id === (over.id as number))
        if (idx !== -1) {
          newStage = stage
          newPosition = idx
          break
        }
      }
    }

    if (!newStage) return

    reorderMutation.mutate({ id: cardId, stage: newStage, position: newPosition })
  }

  const totalCards = grouped
    ? STAGES.reduce((sum, s) => sum + (grouped[s]?.length ?? 0), 0)
    : 0

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">Content Pipeline</h2>
          <p className="text-slate-400 text-sm mt-1">
            Ideas &rarr; Roteiro &rarr; Thumbnail &rarr; Gravacao &rarr; Edicao &rarr; Publicado
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{totalCards} cards</span>
          <button
            onClick={() => setCreateStage('ideas')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Novo Card
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400">Carregando pipeline...</p>
          </div>
        </div>
      )}

      {isError && (
        <div className="bg-red-950/40 border border-red-900 rounded-lg px-4 py-3 text-red-400 text-sm">
          Erro ao carregar o pipeline. Tente recarregar a pagina.
        </div>
      )}

      {!isLoading && !isError && grouped && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                cards={grouped[stage] ?? []}
                onAddCard={(s) => setCreateStage(s)}
              />
            ))}
          </div>
        </DndContext>
      )}

      {createStage && (
        <CreateCardModal
          defaultStage={createStage}
          onClose={() => setCreateStage(null)}
        />
      )}
    </div>
  )
}
