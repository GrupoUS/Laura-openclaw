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
// Static hierarchy — GRUPO US org chart (REAL AGENTS ONLY)
// ---------------------------------------------------------------------------

const HIERARCHY_TEMPLATE: Omit<AgentNode, 'status' | 'skills' | 'tools'>[] = [
  // Level 0 — Fundador (humano)
  { id: 'mauricio', name: 'Maurício', role: 'Fundador', level: 0, reportsTo: null, manages: ['laura', 'claudete'] },

  // Level 1 — C-Level
  { id: 'laura', name: 'Laura', role: 'CEO — Orquestradora & SDR', level: 1, reportsTo: 'mauricio', manages: ['coder', 'cs', 'suporte'], requiredSkill: 'agent-team-orchestration' },
  { id: 'claudete', name: 'Claudete', role: 'RH — Recrutamento & Onboarding', level: 1, reportsTo: 'mauricio', manages: [], requiredSkill: 'agent-builder' },

  // Level 2 — Directors (real gateway agents)
  { id: 'coder', name: 'Coder', role: 'Diretor de Tecnologia', level: 2, reportsTo: 'laura', manages: [] },
  { id: 'cs', name: 'CS', role: 'Diretor de Customer Success', level: 2, reportsTo: 'laura', manages: [] },
  { id: 'suporte', name: 'Suporte', role: 'Diretor de Operações & PM', level: 2, reportsTo: 'laura', manages: [] },
]

// Map gateway agent IDs to hierarchy IDs (1:1 — all agents are real)
const GATEWAY_TO_HIERARCHY: Record<string, string> = {
  main: 'laura',
  coder: 'coder',
  cs: 'cs',
  suporte: 'suporte',
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

// Agent → skills mapping (real agents, real skills)
const AGENT_SKILLS: Record<string, string[]> = {
  laura: ['agent-team-orchestration', 'planning', 'google-ai-sdk', 'meta-api-integration'],
  claudete: ['agent-builder', 'skill-creator'],
  coder: ['frontend-rules', 'backend-design', 'docker-deploy', 'performance-optimization', 'webapp-testing'],
  cs: ['clerk-neon-auth', 'evolution-core', 'notion'],
  suporte: ['debugger', 'security-audit', 'seo-optimization'],
}

// ---------------------------------------------------------------------------
// Workflow cycles (real agents only)
// ---------------------------------------------------------------------------

const WORKFLOW_CYCLES: WorkflowCycle[] = [
  { weekday: 'Segunda', steps: [
    { agent: 'laura', action: 'Planejamento semanal & routing de tarefas', time: '09:00' },
    { agent: 'coder', action: 'Sprint planning & code review', time: '10:00' },
  ]},
  { weekday: 'Terça', steps: [
    { agent: 'coder', action: 'Feature development', time: '09:00' },
    { agent: 'cs', action: 'Onboarding check-in de alunos', time: '10:00' },
  ]},
  { weekday: 'Quarta', steps: [
    { agent: 'laura', action: 'Review & handoffs com equipe', time: '09:00' },
    { agent: 'suporte', action: 'Varredura de tarefas & cobranças', time: '10:00' },
    { agent: 'cs', action: 'Relatórios de evolução NEON', time: '14:00' },
  ]},
  { weekday: 'Quinta', steps: [
    { agent: 'coder', action: 'Bug fixes & deploys', time: '09:00' },
    { agent: 'suporte', action: 'Report de bloqueios à diretoria', time: '10:00' },
  ]},
  { weekday: 'Sexta', steps: [
    { agent: 'laura', action: 'Retrospectiva semanal', time: '09:00' },
    { agent: 'suporte', action: 'Relatório de inadimplentes', time: '10:00' },
  ]},
  { weekday: 'Sábado', steps: [
    { agent: 'cs', action: 'Check proativo de alunos inativos', time: '10:00' },
  ]},
  { weekday: 'Domingo', steps: [
    { agent: 'laura', action: 'Heartbeat geral', time: '20:00' },
  ]},
]

// ---------------------------------------------------------------------------
// Token costs (mock data — real agent structure)
// ---------------------------------------------------------------------------

const MONTHLY_BUDGET = 10_000 // R$
const MOCK_TOKEN_COSTS: TokenCost[] = [
  { squad: 'Liderança (Laura)', director: 'laura', tokens: 2_800_000, cost: 3_200, budgetPercent: 32 },
  { squad: 'Tecnologia (Coder)', director: 'coder', tokens: 1_500_000, cost: 1_800, budgetPercent: 18 },
  { squad: 'Customer Success', director: 'cs', tokens: 1_200_000, cost: 1_400, budgetPercent: 14 },
  { squad: 'Operações (Suporte)', director: 'suporte', tokens: 900_000, cost: 1_100, budgetPercent: 11 },
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

      // Default: 'idle' for planned agents, 'active' for Mauricio
      let status: AgentStatus = tmpl.id === 'mauricio' ? 'active' : 'idle'
      if (gatewayId) {
        const isLive = liveAgents.some((a) => a.id === gatewayId)
        const isActive = activeGatewayIds.has(gatewayId)
        if (isActive) status = 'in_workflow'
        else if (isLive) status = 'active'
        else status = 'idle'
      }

      return Object.assign({}, tmpl, {
        status,
        skills: AGENT_SKILLS[tmpl.id] ?? [],
        tools: [] as string[],
      })
    })
  }),

  /** Skills map — workspace skills × assigned agents (merged with agent-referenced skills) */
  skillsMap: publicProcedure.query(async (): Promise<SkillEntry[]> => {
    const workspaceSkills = await scanWorkspaceSkills()

    // Collect ALL skill names: workspace + agent-referenced
    const allSkillNames = new Set(workspaceSkills)
    for (const skills of Object.values(AGENT_SKILLS)) {
      for (const skill of skills) {
        allSkillNames.add(skill)
      }
    }

    // Build reverse map: skill → agents
    const skillToAgents: Record<string, string[]> = {}
    for (const skill of allSkillNames) {
      skillToAgents[skill] = []
    }
    for (const [agentId, skills] of Object.entries(AGENT_SKILLS)) {
      for (const skill of skills) {
        skillToAgents[skill].push(agentId)
      }
    }

    // Sort: unassigned first, then alphabetical
    return Array.from(allSkillNames)
      .map((name): SkillEntry => ({
        name,
        assignedAgents: skillToAgents[name] ?? [],
        unassigned: (skillToAgents[name] ?? []).length === 0,
      }))
      .toSorted((a, b) => {
        if (a.unassigned !== b.unassigned) return a.unassigned ? -1 : 1
        return a.name.localeCompare(b.name)
      })
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
