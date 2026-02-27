import { useState, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/client/components/dashboard/ui/dialog'
import { ScrollArea } from '@/client/components/dashboard/ui/scroll-area'
import { Badge } from '@/client/components/dashboard/ui/badge'
import { AgentBadge } from '@/client/components/dashboard/shared/AgentBadge'
import { SubtaskProgress } from '@/client/components/dashboard/shared/SubtaskProgress'
import { useTaskStore } from '@/client/hooks/useTaskStore'
import { patchTaskFields, patchSubtaskStatus, createSubtask } from '@/client/lib/api'
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  AGENT_EMOJIS,
} from '@/shared/types/tasks'
import type { Task, Subtask } from '@/shared/types/tasks'
import { Check, Plus, Calendar, User, Layers } from 'lucide-react'

interface Props {
  taskId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailModal({ taskId, open, onOpenChange }: Props) {
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId))

  if (!task) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle className="sr-only">Task</DialogTitle>
          <DialogDescription className="sr-only">Detalhes da task</DialogDescription>
          <div className="p-8 text-center text-slate-400">Task not found</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="sr-only">{task.title}</DialogTitle>
        <DialogDescription className="sr-only">Detalhes da task #{task.id}</DialogDescription>
        <ScrollArea className="max-h-[80vh]">
          <div className="px-5 pt-5 pb-6 space-y-5">
            <TaskHeader task={task} />
            <EditableTitle task={task} />
            <EditableDescription task={task} />
            <SubtasksSection task={task} />
            <NotesSection task={task} />
            <MetadataFooter task={task} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ── Header: ID + Status + Priority ──────────────────────────────────

function TaskHeader({ task }: { task: Task }) {
  const statusStyle = STATUS_COLORS[task.status]
  const priorityColor = PRIORITY_COLORS[task.priority]

  return (
    <div className="flex items-center gap-2 flex-wrap pr-8">
      <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
        #{String(task.id).slice(0, 8)}
      </span>
      <Badge
        variant="outline"
        className={`text-[11px] px-2 py-0.5 ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text} border dark:bg-opacity-20`}
      >
        {STATUS_LABELS[task.status]}
      </Badge>
      <span className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${priorityColor}`} />
        <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
          {task.priority}
        </span>
      </span>
    </div>
  )
}

// ── Editable Title ──────────────────────────────────────────────────

function EditableTitle({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const upsertTask = useTaskStore((s) => s.upsertTask)

  const save = useCallback(async () => {
    setEditing(false)
    const trimmed = value.trim()
    if (!trimmed || trimmed === task.title) {
      setValue(task.title)
      return
    }
    const prev = task.title
    upsertTask({ ...task, title: trimmed })
    try {
      await patchTaskFields(task.id, { title: trimmed })
    } catch {
      upsertTask({ ...task, title: prev })
      setValue(prev)
    }
  }, [value, task, upsertTask])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); save() }
    if (e.key === 'Escape') { setValue(task.title); setEditing(false) }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full text-lg font-semibold bg-transparent border-b-2 border-blue-400 outline-none text-slate-900 dark:text-slate-100 pb-0.5"
      />
    )
  }

  return (
    <h2
      onClick={() => { setValue(task.title); setEditing(true) }}
      className="text-lg font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded px-1 -mx-1 py-0.5 transition-colors"
    >
      {task.title}
    </h2>
  )
}

// ── Editable Description ────────────────────────────────────────────

function EditableDescription({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(task.description ?? '')
  const upsertTask = useTaskStore((s) => s.upsertTask)

  const save = useCallback(async () => {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed === (task.description ?? '')) return
    const prev = task.description
    upsertTask({ ...task, description: trimmed || null })
    try {
      await patchTaskFields(task.id, { description: trimmed })
    } catch {
      upsertTask({ ...task, description: prev })
      setValue(prev ?? '')
    }
  }, [value, task, upsertTask])

  return (
    <div>
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        Descricao
      </label>
      {editing ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          autoFocus
          rows={3}
          className="w-full mt-1 text-sm bg-transparent border border-blue-400 rounded-md outline-none text-slate-700 dark:text-slate-300 p-2 resize-none"
        />
      ) : (
        <p
          onClick={() => { setValue(task.description ?? ''); setEditing(true) }}
          className="mt-1 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded px-2 -mx-2 py-1 transition-colors min-h-[2rem]"
        >
          {task.description || 'Clique para adicionar descricao...'}
        </p>
      )}
    </div>
  )
}

// ── Subtasks Section ────────────────────────────────────────────────

function SubtasksSection({ task }: { task: Task }) {
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const upsertSubtask = useTaskStore((s) => s.upsertSubtask)

  const doneCount = task.subtasks.filter((s) => s.status === 'done').length

  const toggleSubtask = useCallback(async (subtask: Subtask) => {
    const newStatus = subtask.status === 'done' ? 'todo' : 'done'
    const prev = subtask.status
    upsertSubtask(task.id, { ...subtask, status: newStatus })
    try {
      await patchSubtaskStatus(task.id, subtask.id, newStatus)
    } catch {
      upsertSubtask(task.id, { ...subtask, status: prev })
    }
  }, [task.id, upsertSubtask])

  const handleAddSubtask = useCallback(async () => {
    const trimmed = newTitle.trim()
    if (!trimmed) { setAdding(false); return }
    setNewTitle('')
    setAdding(false)
    try {
      await createSubtask({ taskId: Number(task.id), title: trimmed })
    } catch {
      // subtask will appear via SSE if created
    }
  }, [newTitle, task.id])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask() }
    if (e.key === 'Escape') { setNewTitle(''); setAdding(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Subtasks
          </label>
          {task.subtasks.length > 0 && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              ({doneCount}/{task.subtasks.length} concluidas)
            </span>
          )}
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </button>
      </div>

      {task.subtasks.length > 0 && (
        <SubtaskProgress subtasks={task.subtasks} />
      )}

      <div className="mt-2 space-y-1">
        {task.subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center gap-2.5 py-1.5 px-2 -mx-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <button
              onClick={() => toggleSubtask(subtask)}
              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                subtask.status === 'done'
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
              }`}
            >
              {subtask.status === 'done' && <Check className="w-3 h-3" />}
            </button>
            <span
              className={`text-sm flex-1 ${
                subtask.status === 'done'
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {subtask.title}
            </span>
            {subtask.agent && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {AGENT_EMOJIS[subtask.agent] ?? ''} {subtask.agent}
              </span>
            )}
          </div>
        ))}

        {adding && (
          <div className="flex items-center gap-2.5 py-1.5 px-2 -mx-2">
            <span className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 shrink-0" />
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleAddSubtask}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder="Nova subtask..."
              className="flex-1 text-sm bg-transparent outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
            />
          </div>
        )}

        {task.subtasks.length === 0 && !adding && (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-2">
            Nenhuma subtask ainda
          </p>
        )}
      </div>
    </div>
  )
}

// ── Notes Section ───────────────────────────────────────────────────

function NotesSection({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(task.notes ?? '')
  const upsertTask = useTaskStore((s) => s.upsertTask)

  const save = useCallback(async () => {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed === (task.notes ?? '')) return
    const prev = task.notes
    upsertTask({ ...task, notes: trimmed || null })
    try {
      await patchTaskFields(task.id, { notes: trimmed })
    } catch {
      upsertTask({ ...task, notes: prev })
      setValue(prev ?? '')
    }
  }, [value, task, upsertTask])

  return (
    <div>
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        Observacoes
      </label>
      {editing ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          autoFocus
          rows={3}
          placeholder="Adicione observacoes..."
          className="w-full mt-1 text-sm bg-transparent border border-blue-400 rounded-md outline-none text-slate-700 dark:text-slate-300 p-2 resize-none placeholder:text-slate-400"
        />
      ) : (
        <p
          onClick={() => { setValue(task.notes ?? ''); setEditing(true) }}
          className="mt-1 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded px-2 -mx-2 py-1 transition-colors min-h-[2rem]"
        >
          {task.notes || 'Clique para adicionar observacoes...'}
        </p>
      )}
    </div>
  )
}

// ── Metadata Footer ─────────────────────────────────────────────────

function MetadataFooter({ task }: { task: Task }) {
  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
      <span className="flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5" />
        Fase F{task.phase}
      </span>
      <span className="flex items-center gap-1.5">
        <User className="w-3.5 h-3.5" />
        <AgentBadge agent={task.agent} size="sm" />
        <span>{task.agent ?? 'system'}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" />
        Criado: {fmt(task.createdAt)}
      </span>
      <span className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" />
        Atualizado: {fmt(task.updatedAt)}
      </span>
    </div>
  )
}
