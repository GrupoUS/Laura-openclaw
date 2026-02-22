import { readdir } from 'node:fs/promises'
import { router, publicProcedure } from '../trpc-init'
import { gatewayCall } from '../ws/openclaw'
import type {
  AgentNode,
  AgentStatus,
  SkillEntry,
  ToolEntry,
  TokenCost,
  WorkflowCycle,
  AlertItem,
} from '@/shared/types/orchestration'

// ---------------------------------------------------------------------------
// Static hierarchy — GRUPO US org chart
// ---------------------------------------------------------------------------

const HIERARCHY_TEMPLATE: Omit<AgentNode, 'status' | 'skills' | 'tools'>[] = [
  // Level 0
  { id: 'mauricio', name: 'Maurício', role: 'Fundador', level: 0, reportsTo: null, manages: ['laura', 'claudete'] },

  // Level 1
  { id: 'laura', name: 'Laura', role: 'CEO — Orquestradora Principal', level: 1, reportsTo: 'mauricio', manages: ['celso', 'flora', 'otto', 'cris', 'mila'], requiredSkill: 'agent-team-orchestration' },
  { id: 'claudete', name: 'Claudete', role: 'RH — Recrutamento & Onboarding', level: 1, reportsTo: 'mauricio', manages: [], requiredSkill: 'agent-builder' },

  // Level 2 — Directors
  { id: 'celso', name: 'Celso', role: 'Diretor de Marketing', level: 2, reportsTo: 'laura', manages: ['rafa', 'duda', 'maia', 'luca_t', 'luca_p', 'sara', 'malu', 'luca_i', 'dora'] },
  { id: 'flora', name: 'Flora', role: 'Diretora de Produto & Tecnologia', level: 2, reportsTo: 'laura', manages: [] },
  { id: 'otto', name: 'Otto', role: 'Diretor de Operações', level: 2, reportsTo: 'laura', manages: [] },
  { id: 'cris', name: 'Cris', role: 'Diretora Financeiro & IBI', level: 2, reportsTo: 'laura', manages: [] },
  { id: 'mila', name: 'Mila', role: 'Diretora de Comunidade', level: 2, reportsTo: 'laura', manages: [] },

  // Level 3 — Operacionais (under Celso for now)
  { id: 'rafa', name: 'Rafa', role: 'Copywriter', level: 3, reportsTo: 'celso', manages: [] },
  { id: 'duda', name: 'Duda', role: 'Social Media', level: 3, reportsTo: 'celso', manages: [] },
  { id: 'maia', name: 'Maia', role: 'Roteirista', level: 3, reportsTo: 'celso', manages: [] },
  { id: 'luca_t', name: 'Luca T.', role: 'Diretor de Tráfego Pago', level: 3, reportsTo: 'celso', manages: [] },
  { id: 'luca_p', name: 'Luca P.', role: 'Pesquisador de Tendências', level: 3, reportsTo: 'celso', manages: [] },
  { id: 'sara', name: 'Sara', role: 'Pré-Venda', level: 3, reportsTo: 'celso', manages: [] },
  { id: 'malu', name: 'Malu', role: 'Afiliados & Parcerias', level: 3, reportsTo: 'celso', manages: [] },
  { id: 'luca_i', name: 'Luca I.', role: 'Inteligência Competitiva', level: 3, reportsTo: 'celso', manages: [] },
  { id: 'dora', name: 'Dora', role: 'Arquitetura de Lançamentos', level: 3, reportsTo: 'celso', manages: [] },
]

// Map gateway agent IDs to hierarchy IDs
const GATEWAY_TO_HIERARCHY: Record<string, string> = {
  main: 'laura',
  suporte: 'laura', // suporte is managed by Laura
}

// ---------------------------------------------------------------------------
// Workspace skills directory
// ---------------------------------------------------------------------------

const WORKSPACE_SKILLS_DIR = '/Users/mauricio/.openclaw/workspace/skills'

async function scanWorkspaceSkills(): Promise<string[]> {
  try {
    const entries = await readdir(WORKSPACE_SKILLS_DIR, { withFileTypes: true })
    return entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
      .map((e) => e.name)
  } catch {
    return []
  }
}

// Agent → skills mapping (skills from prompt specification)
const AGENT_SKILLS: Record<string, string[]> = {
  laura: ['agent-team-orchestration', 'planning', 'parallel-agents'],
  claudete: ['agent-builder', 'ontology'],
  celso: ['canvas-design', 'seo-fundamentals', 'frontend-design'],
  flora: ['react-patterns', 'typescript-expert', 'architecture', 'database-design'],
  otto: ['docker-expert', 'server-management', 'performance-profiling'],
  cris: ['ai-data-analyst', 'asaas'],
  mila: ['brainstorming', 'product-management'],
  rafa: ['plan-writing', 'documentation-templates'],
  duda: ['canvas-design', 'nano-banana-pro'],
  maia: ['plan-writing'],
  luca_t: ['tavily-search', 'seo-fundamentals'],
  sara: ['client-flow'],
  malu: ['client-flow'],
  luca_i: ['tavily-search', 'uds-search'],
  luca_p: ['tavily-search', 'uds-search'],
  dora: ['linear-planner', 'task-planning'],
}

// ---------------------------------------------------------------------------
// Workflow cycles (static)
// ---------------------------------------------------------------------------

const WORKFLOW_CYCLES: WorkflowCycle[] = [
  { weekday: 'Segunda', steps: [
    { agent: 'laura', action: 'Planejamento semanal', time: '09:00' },
    { agent: 'celso', action: 'Briefing de conteúdo', time: '10:00' },
    { agent: 'flora', action: 'Sprint planning', time: '11:00' },
  ]},
  { weekday: 'Terça', steps: [
    { agent: 'rafa', action: 'Produção de copies', time: '09:00' },
    { agent: 'duda', action: 'Agendamento de posts', time: '14:00' },
    { agent: 'luca_t', action: 'Otimização de campanhas', time: '10:00' },
  ]},
  { weekday: 'Quarta', steps: [
    { agent: 'laura', action: 'Mentoria com diretores', time: '09:00' },
    { agent: 'mila', action: 'Check-in comunidade', time: '14:00' },
    { agent: 'cris', action: 'Relatório financeiro', time: '16:00' },
  ]},
  { weekday: 'Quinta', steps: [
    { agent: 'otto', action: 'Revisão de operações', time: '09:00' },
    { agent: 'sara', action: 'Follow-up de leads', time: '10:00' },
    { agent: 'maia', action: 'Produção de roteiros', time: '14:00' },
  ]},
  { weekday: 'Sexta', steps: [
    { agent: 'laura', action: 'Retrospectiva semanal', time: '09:00' },
    { agent: 'claudete', action: 'Avaliação de performance', time: '14:00' },
    { agent: 'celso', action: 'Report de resultados', time: '16:00' },
  ]},
  { weekday: 'Sábado', steps: [
    { agent: 'luca_i', action: 'Análise competitiva', time: '10:00' },
    { agent: 'luca_p', action: 'Pesquisa de tendências', time: '10:00' },
  ]},
  { weekday: 'Domingo', steps: [
    { agent: 'laura', action: 'Heartbeat geral', time: '20:00' },
  ]},
]

// ---------------------------------------------------------------------------
// Token costs (mock data)
// ---------------------------------------------------------------------------

const MONTHLY_BUDGET = 10_000 // R$
const MOCK_TOKEN_COSTS: TokenCost[] = [
  { squad: 'Marketing', director: 'celso', tokens: 2_450_000, cost: 2_800, budgetPercent: 28 },
  { squad: 'Produto & Tech', director: 'flora', tokens: 1_200_000, cost: 1_500, budgetPercent: 15 },
  { squad: 'Operações', director: 'otto', tokens: 800_000, cost: 950, budgetPercent: 9.5 },
  { squad: 'Financeiro & IBI', director: 'cris', tokens: 600_000, cost: 720, budgetPercent: 7.2 },
  { squad: 'Comunidade', director: 'mila', tokens: 450_000, cost: 540, budgetPercent: 5.4 },
  { squad: 'Liderança', director: 'laura', tokens: 1_800_000, cost: 2_100, budgetPercent: 21 },
  { squad: 'RH', director: 'claudete', tokens: 300_000, cost: 350, budgetPercent: 3.5 },
]

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const orchestrationRouter = router({
  /** Full org hierarchy with live gateway status merge */
  hierarchy: publicProcedure.query(async ({ ctx }): Promise<AgentNode[]> => {
    // Fetch live agents from gateway
    let liveAgents: Array<Record<string, unknown>> = []
    try {
      const result = await gatewayCall<unknown>('agents_list', {}, ctx.gatewayToken)
      if (Array.isArray(result)) liveAgents = result as Array<Record<string, unknown>>
    } catch {
      // Gateway offline — all agents show as 'offline'
    }

    // Fetch live sessions for status
    let liveSessions: Array<Record<string, unknown>> = []
    try {
      const result = await gatewayCall<unknown>('sessions_list', {}, ctx.gatewayToken)
      if (Array.isArray(result)) liveSessions = result as Array<Record<string, unknown>>
    } catch {
      // ignore
    }

    // Determine active agent IDs from sessions
    const activeGatewayIds = new Set(
      liveSessions.map((s) => String(s.agentId ?? ''))
    )

    // Build hierarchy nodes with live status
    return HIERARCHY_TEMPLATE.map((tmpl): AgentNode => {
      // Check if this hierarchy agent maps to a gateway agent
      const gatewayId = Object.entries(GATEWAY_TO_HIERARCHY)
        .find(([, hId]) => hId === tmpl.id)?.[0]

      let status: AgentStatus = 'offline'
      if (gatewayId) {
        const isLive = liveAgents.some((a) => a.id === gatewayId)
        const isActive = activeGatewayIds.has(gatewayId)
        if (isActive) status = 'in_workflow'
        else if (isLive) status = 'active'
        else status = 'idle'
      } else if (tmpl.id === 'mauricio') {
        status = 'active' // Mauricio always shown as active
      }

      return Object.assign({}, tmpl, {
        status,
        skills: AGENT_SKILLS[tmpl.id] ?? [],
        tools: [] as string[],
      })
    })
  }),

  /** Skills map — workspace skills × assigned agents */
  skillsMap: publicProcedure.query(async (): Promise<SkillEntry[]> => {
    const allSkills = await scanWorkspaceSkills()

    // Build reverse map: skill → agents
    const skillToAgents: Record<string, string[]> = {}
    for (const skill of allSkills) {
      skillToAgents[skill] = []
    }
    for (const [agentId, skills] of Object.entries(AGENT_SKILLS)) {
      for (const skill of skills) {
        if (!skillToAgents[skill]) skillToAgents[skill] = []
        skillToAgents[skill].push(agentId)
      }
    }

    return allSkills.map((name): SkillEntry => ({
      name,
      assignedAgents: skillToAgents[name] ?? [],
      unassigned: (skillToAgents[name] ?? []).length === 0,
    }))
  }),

  /** Tools map — gateway tools × agents */
  toolsMap: publicProcedure.query(async ({ ctx }): Promise<ToolEntry[]> => {
    let tools: Array<Record<string, unknown>> = []
    try {
      const result = await gatewayCall<unknown>('tools_list', {}, ctx.gatewayToken)
      if (Array.isArray(result)) tools = result as Array<Record<string, unknown>>
    } catch {
      return []
    }

    return tools.map((t): ToolEntry => ({
      name: String(t.name ?? t.id ?? 'unknown'),
      usedByAgents: Array.isArray(t.agents) ? (t.agents as string[]) : [],
      unused: !Array.isArray(t.agents) || (t.agents as string[]).length === 0,
    }))
  }),

  /** Token costs by squad (mock) */
  tokenCosts: publicProcedure.query((): { costs: TokenCost[]; budget: number } => {
    return { costs: MOCK_TOKEN_COSTS, budget: MONTHLY_BUDGET }
  }),

  /** Weekly workflow cycles */
  workflowCycles: publicProcedure.query((): WorkflowCycle[] => {
    return WORKFLOW_CYCLES
  }),

  /** Aggregated alerts */
  alerts: publicProcedure.query(async (): Promise<AlertItem[]> => {
    const allSkills = await scanWorkspaceSkills()
    const alerts: AlertItem[] = []

    // Skills not assigned to any agent
    const assignedSkills = new Set(Object.values(AGENT_SKILLS).flat())
    for (const skill of allSkills) {
      if (!assignedSkills.has(skill)) {
        alerts.push({
          type: 'unassigned_skill',
          severity: 'warning',
          title: `Skill "${skill}" sem agente`,
          detail: `A skill ${skill} está disponível no workspace mas não está atribuída a nenhum agente.`,
        })
      }
    }

    // Token overload check (mock)
    for (const cost of MOCK_TOKEN_COSTS) {
      if (cost.budgetPercent > 25) {
        alerts.push({
          type: 'token_overload',
          severity: 'warning',
          title: `Squad ${cost.squad} acima do threshold`,
          detail: `Consumindo ${cost.budgetPercent}% do budget mensal (R$ ${cost.cost.toLocaleString('pt-BR')}).`,
        })
      }
    }

    return alerts
  }),
})
