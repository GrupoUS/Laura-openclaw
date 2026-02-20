import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const maxDuration = 30  // Railway: at\u00e9 30s para LLM

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// JSON Schema do plano \u2014 id\u00eantico ao task_planning skill da Laura
const PLAN_TOOL: Anthropic.Tool = {
  name: 'plan_task',
  description: 'Decomp\u00f5e uma tarefa em fases e subtarefas at\u00f4micas execut\u00e1veis por agentes de IA',
  input_schema: {
    type: 'object' as const,
    properties: {
      title:       { type: 'string', description: 'T\u00edtulo objetivo (m\u00e1x 80 chars)' },
      description: { type: 'string', description: 'Contexto e objetivo completo' },
      priority:    { type: 'string', enum: ['low','medium','high','critical'] },
      agent:       { type: 'string', enum: ['laura','coder','support','devops','designer'], description: 'Agente principal respons\u00e1vel' },
      phases: {
        type: 'array',
        description: '1 a 4 fases sequenciais',
        items: {
          type: 'object',
          properties: {
            phase:    { type: 'integer', minimum: 1 },
            name:     { type: 'string',  description: 'Nome curto da fase' },
            subtasks: {
              type: 'array',
              description: '2 a 8 subtarefas at\u00f4micas (verbo no imperativo)',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'A\u00e7\u00e3o at\u00f4mica, m\u00e1x 100 chars' },
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

const SYSTEM_PROMPT = `Voc\u00ea \u00e9 Laura, a orquestradora de IA do Grupo US \u2014 empresa de cursos online sobre harmoniza\u00e7\u00e3o facial, est\u00e9tica avan\u00e7ada, marketing e finan\u00e7as para cl\u00ednicas de est\u00e9tica.

Ao planejar uma task:
- Decomponha em a\u00e7\u00f5es AT\u00d4MICAS (5-30 min cada) execut\u00e1veis por IA
- Agentes dispon\u00edveis: laura (estrat\u00e9gia/conte\u00fado), coder (c\u00f3digo/dados), support (atendimento/comunica\u00e7\u00e3o), devops (infraestrutura), designer (visual)
- Fases sequenciais: pesquisa \u2192 desenvolvimento \u2192 revis\u00e3o \u2192 deploy
- Subtarefas devem ser espec\u00edficas e mensur\u00e1veis, nunca vagas`

export async function POST(req: NextRequest) {
  // Auth
  const secret = req.headers.get('x-laura-secret')
  if (secret !== process.env.LAURA_API_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { description, priority = 'medium', agent = 'laura' } =
    await req.json() as { description: string; priority?: string; agent?: string }

  if (!description?.trim()) {
    return Response.json({ error: 'description \u00e9 obrigat\u00f3rio' }, { status: 400 })
  }

  try {
    const response = await client.messages.create({
      model:      process.env.PLANNING_MODEL ?? 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      system:     SYSTEM_PROMPT,
      tools:      [PLAN_TOOL],
      tool_choice: { type: 'tool', name: 'plan_task' },   // JSON garantido
      messages: [{
        role: 'user',
        content: `Planeje esta solicita\u00e7\u00e3o para o sistema de tarefas do Grupo US:\n\n"${description.trim()}"\n\nPrioridade sugerida: ${priority}\nAgente principal sugerido: ${agent}`,
      }],
    })

    // Extrair o tool_use block
    const toolBlock = response.content.find((b) => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      throw new Error('Anthropic n\u00e3o retornou tool_use block')
    }

    const plan = toolBlock.input as any

    return Response.json({
      data: plan,
      meta: {
        model:        response.model,
        inputTokens:  response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    })
  } catch (err: any) {
    console.error('[/api/tasks/plan] Erro:', err.message)
    return Response.json(
      { error: 'Falha ao gerar plano. Tente descrever a tarefa de outra forma.' },
      { status: 503 }
    )
  }
}
