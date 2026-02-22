import { z } from 'zod'
import { router, publicProcedure } from '../trpc-init'
import { getTasks, getTaskById, createTask, updateTask, createSubtask, updateSubtask } from '../db/queries'
import { eventBus } from '../events/emitter'

const taskStatusEnum = z.enum(['backlog', 'in_progress', 'done', 'blocked'])
const priorityEnum = z.enum(['low', 'medium', 'high', 'critical'])
const subtaskStatusEnum = z.enum(['todo', 'doing', 'done', 'blocked'])

export const tasksRouter = router({
  list: publicProcedure
    .input(z.object({
      status: taskStatusEnum.optional(),
      agent:  z.string().optional(),
      phase:  z.number().int().optional(),
    }).optional())
    .query(async ({ input }) => {
      const tasks = await getTasks(input ?? {})
      return { data: tasks, count: tasks.length }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const task = await getTaskById(input.id)
      if (!task) throw new Error('Not found')
      return { data: task }
    }),

  create: publicProcedure
    .input(z.object({
      title:       z.string().min(3).max(200),
      description: z.string().optional(),
      phase:       z.number().int().min(1).default(1),
      priority:    priorityEnum.default('medium'),
      agent:       z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const task = await createTask(input)
      eventBus.publish({
        type: 'task:created',
        taskId: task.id,
        payload: task as unknown as Record<string, unknown>,
        agent: input.agent,
        ts: new Date().toISOString(),
      })
      return { data: task }
    }),

  update: publicProcedure
    .input(z.object({
      id:       z.number().int(),
      status:   taskStatusEnum.optional(),
      priority: priorityEnum.optional(),
      agent:    z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      const task = await updateTask(id, data)
      if (!task) throw new Error('Not found')
      eventBus.publish({
        type: 'task:updated',
        taskId: task.id,
        payload: task as unknown as Record<string, unknown>,
        agent: input.agent,
        ts: new Date().toISOString(),
      })
      return { data: task }
    }),

  createSubtask: publicProcedure
    .input(z.object({
      taskId: z.number().int(),
      title:  z.string().min(3).max(300),
      phase:  z.number().int().min(1).default(1),
      agent:  z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const subtask = await createSubtask(input)
      eventBus.publish({
        type: 'subtask:created',
        taskId: input.taskId,
        payload: subtask as unknown as Record<string, unknown>,
        agent: input.agent,
        ts: new Date().toISOString(),
      })
      return { data: subtask }
    }),

  updateSubtask: publicProcedure
    .input(z.object({
      taskId: z.number().int(),
      sid:    z.number().int(),
      status: subtaskStatusEnum,
    }))
    .mutation(async ({ input }) => {
      const subtask = await updateSubtask(input.sid, input.status)
      if (!subtask) throw new Error('Not found or race condition')
      eventBus.publish({
        type: 'subtask:updated',
        taskId: input.taskId,
        payload: subtask as unknown as Record<string, unknown>,
        ts: new Date().toISOString(),
      })
      return { data: subtask }
    }),

  plan: publicProcedure
    .input(z.object({
      description: z.string().min(1),
      priority:    z.string().default('medium'),
      agent:       z.string().default('laura'),
    }))
    .mutation(async ({ input }) => {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      const PLAN_TOOL = {
        name: 'plan_task',
        description: 'Decompõe uma tarefa em fases e subtarefas atômicas',
        input_schema: {
          type: 'object' as const,
          properties: {
            title:       { type: 'string' },
            description: { type: 'string' },
            priority:    { type: 'string', enum: ['low','medium','high','critical'] },
            agent:       { type: 'string', enum: ['laura','coder','support','devops','designer'] },
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase:    { type: 'integer', minimum: 1 },
                  name:     { type: 'string' },
                  subtasks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        agent: { type: 'string', enum: ['laura','coder','support','devops','designer'] },
                      },
                      required: ['title','agent'],
                    },
                  },
                },
                required: ['phase','name','subtasks'],
              },
            },
          },
          required: ['title','description','priority','agent','phases'],
        },
      }

      const response = await client.messages.create({
        model:      process.env.PLANNING_MODEL ?? 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        system:     `Você é Laura, a orquestradora de IA do Grupo US. Ao planejar uma task, decomponha em ações ATÔMICAS (5-30 min cada) executáveis por IA.`,
        tools:      [PLAN_TOOL],
        tool_choice: { type: 'tool', name: 'plan_task' },
        messages: [{
          role: 'user',
          content: `Planeje: "${input.description.trim()}" | Prioridade: ${input.priority} | Agente: ${input.agent}`,
        }],
      })

      const toolBlock = response.content.find((b) => b.type === 'tool_use')
      if (!toolBlock || toolBlock.type !== 'tool_use') {
        throw new Error('Anthropic did not return tool_use block')
      }

      return {
        data: toolBlock.input,
        meta: {
          model:        response.model,
          inputTokens:  response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      }
    }),
})
