'use client'
import { useEffect } from 'react'
import { PhaseGroup } from './PhaseGroup'
import { useTaskStore } from '@/hooks/useTaskStore'
import { useTaskEvents } from '@/hooks/useTaskEvents'
import { ViewHeader } from '@/components/layout/ViewHeader'
import type { Task } from '@/types/tasks'

export function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const setTasks = useTaskStore((s) => s.setTasks)
  useEffect(() => { setTasks(initialTasks) }, [initialTasks, setTasks])
  useTaskEvents()

  const groups = useTaskStore((s) => s.tasksByPhase())
  const phases = Object.keys(groups).map(Number).sort((a, b) => a - b)

  return (
    <>
      <ViewHeader title="📋 Lista de Tarefas" />
      <div className="flex-1 overflow-y-auto p-6">
        {phases.length === 0 && (
          <div className="text-center text-slate-400 py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">Nenhuma tarefa criada ainda.</p>
            <p className="text-xs mt-1">Solicite algo à Laura para ver as tasks aqui.</p>
          </div>
        )}
        {phases.map((phase) => (
          <PhaseGroup key={phase} phase={phase} tasks={groups[phase]} />
        ))}
      </div>
    </>
  )
}
