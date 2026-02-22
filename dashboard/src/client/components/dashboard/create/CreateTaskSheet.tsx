
import { useState, useRef } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/client/components/dashboard/ui/sheet'
import { Button } from '@/client/components/dashboard/ui/button'
import { Textarea } from '@/client/components/dashboard/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/client/components/dashboard/ui/select'
import { PlanPreview, type TaskPlan } from './PlanPreview'
import { createTask, createSubtask } from '@/client/lib/api'

interface Props { open: boolean; onClose: () => void }

type Step = 'form' | 'loading' | 'preview' | 'creating' | 'done'

export function CreateTaskSheet({ open, onClose }: Props) {
  const [step,        setStep]        = useState<Step>('form')
  const [description, setDescription] = useState('')
  const [priority,    setPriority]    = useState('high')
  const [agent,       setAgent]       = useState('laura')
  const [plan,        setPlan]        = useState<TaskPlan | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const reset = () => {
    setStep('form'); setPlan(null); setError(null)
    setDescription(''); setPriority('high'); setAgent('laura')
  }

  const handleClose = () => { reset(); onClose() }

  // Step 1 \u2192 Step 2: chamar LLM
  const handlePlan = async () => {
    if (!description.trim()) return
    setStep('loading')
    setError(null)
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/tasks/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ description, priority, agent }),
        signal: abortRef.current.signal,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao gerar plano')
      }
      const { data } = await res.json()
      setPlan(data)
      setStep('preview')
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') { setStep('form'); return }
      setError(e instanceof Error ? e.message : 'Unknown error')
      setStep('form')
    }
  }

  // Step 2 \u2192 confirmar: criar task + subtasks
  const handleConfirm = async () => {
    if (!plan) return
    setStep('creating')
    try {
      // 1. Criar task principal
      const task = await createTask({
        title:       plan.title,
        description: plan.description,
        priority:    plan.priority as 'low' | 'medium' | 'high' | 'critical',
        agent:       plan.agent,
        phase:       1,
      })

      // 2. Criar subtasks de todas as fases em sequ\u00eancia
      const subtasksToCreate = [];
      for (const phase of plan.phases) {
        for (const st of phase.subtasks) {
          subtasksToCreate.push(
            createSubtask({
              taskId: task.id,
              title:  st.title,
              agent:  st.agent,
              phase:  phase.phase,
            })
          )
        }
      }
      await Promise.all(subtasksToCreate)

      setStep('done')
      setTimeout(() => { handleClose() }, 1500)
    } catch {
      setError('Erro ao criar task. Verifique sua conex\u00e3o.')
      setStep('preview')
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <SheetContent className="w-[480px] flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {step === 'preview'  ? '\ud83d\udccb Revisar Plano'  :
             step === 'done'     ? '\u2705 Task Criada!'   : '\u2795 Nova Task'}
          </SheetTitle>
          <SheetDescription>
            {step === 'form'    && 'Descreva o que precisa ser feito. Laura vai decompor automaticamente.'}
            {step === 'loading' && 'Laura est\u00e1 planejando...'}
            {step === 'preview' && 'Revise o plano antes de criar.'}
            {step === 'creating'&& 'Criando task e subtarefas...'}
            {step === 'done'    && 'Atualize o Kanban para ver a nova task.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 1: Formul\u00e1rio */}
          {(step === 'form' || step === 'loading') && (
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="task-description" className="text-xs font-medium text-slate-700 mb-1.5 block">
                  Descri\u00e7\u00e3o da tarefa *
                </label>
                <Textarea
                  id="task-description"
                  placeholder="Ex: Criar landing page para o curso de harmoniza\u00e7\u00e3o facial com formul\u00e1rio de captura de leads e integra\u00e7\u00e3o com ActiveCampaign..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-32 resize-none text-sm"
                  disabled={step === 'loading'}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="task-priority" className="text-xs font-medium text-slate-700 mb-1.5 block">
                    Prioridade
                  </label>
                  <Select value={priority} onValueChange={setPriority} disabled={step === 'loading'}>
                    <SelectTrigger id="task-priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">\ud83d\udfe1 Low</SelectItem>
                      <SelectItem value="medium">\ud83d\udfe0 Medium</SelectItem>
                      <SelectItem value="high">\ud83d\udd34 High</SelectItem>
                      <SelectItem value="critical">\ud83d\udea8 Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="task-agent" className="text-xs font-medium text-slate-700 mb-1.5 block">
                    Agente principal
                  </label>
                  <Select value={agent} onValueChange={setAgent} disabled={step === 'loading'}>
                    <SelectTrigger id="task-agent"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="laura">\ud83e\udde0 Laura</SelectItem>
                      <SelectItem value="coder">\ud83d\udcbb Coder</SelectItem>
                      <SelectItem value="support">\ud83d\udcac Support</SelectItem>
                      <SelectItem value="devops">\u2699\ufe0f DevOps</SelectItem>
                      <SelectItem value="designer">\ud83c\udfa8 Designer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  \u26a0\ufe0f {error}
                </p>
              )}
            </div>
          )}

          {/* Step 2: Preview do plano */}
          {(step === 'preview' || step === 'creating') && plan && (
            <PlanPreview plan={plan} />
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="text-center py-12">
              <p className="text-5xl mb-3">\u2705</p>
              <p className="text-sm font-medium text-slate-700">Task criada com sucesso!</p>
              <p className="text-xs text-slate-400 mt-1">O Kanban j\u00e1 foi atualizado via SSE.</p>
            </div>
          )}
        </div>

        {/* Footer com a\u00e7\u00f5es */}
        <div className="border-t border-slate-200 pt-4 flex gap-2">
          {step === 'form' && (
            <>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handlePlan}
                disabled={!description.trim()}
                className="flex-1"
              >
                \u2728 Planejar com Laura
              </Button>
            </>
          )}
          {step === 'loading' && (
            <Button
              variant="outline"
              onClick={() => { abortRef.current?.abort() }}
              className="flex-1"
            >
              \u2715 Cancelar
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
                \u2190 Editar
              </Button>
              <Button onClick={handleConfirm} className="flex-1">
                \u2705 Criar Task
              </Button>
            </>
          )}
          {step === 'creating' && (
            <Button disabled className="flex-1">
              <span className="animate-spin mr-2">\u27f3</span> Criando...
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
