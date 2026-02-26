import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
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
// Snapshot fallback (used when filesystem is unavailable, e.g. Railway)
// ---------------------------------------------------------------------------

interface SnapshotAgent {
  id: string; name: string; role: string; level: number
  reportsTo: string | null; skills: string[]
}
interface Snapshot {
  generatedAt: string
  agents: SnapshotAgent[]
  workspaceSkills: string[]
}

let _snapshot: Snapshot | null = null
async function loadSnapshot(): Promise<Snapshot | null> {
  if (_snapshot) return _snapshot
  try {
    // Tenta caminho dev (src/server/routers/../data)
    const raw = await readFile(join(import.meta.dir, '../data/openclaw-snapshot.json'), 'utf-8')
    _snapshot = JSON.parse(raw) as Snapshot
    return _snapshot
  } catch {
    try {
      // Tenta caminho prod (dist/index.js -> dist/data/)
      const raw = await readFile(join(import.meta.dir, 'data/openclaw-snapshot.json'), 'utf-8')
      _snapshot = JSON.parse(raw) as Snapshot
      return _snapshot
    } catch {
      return null
    }
  }
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const WORKSPACE_SKILLS_DIR = process.env.WORKSPACE_SKILLS_DIR || '/Users/mauricio/.openclaw/workspace/skills'
const AGENTS_DIR = '/Users/mauricio/.openclaw/agents'

const HIERARCHY_MAP = {
  level0: ["main"],
  level1: ["cs","coder","suporte"],
  level2: ["maia","otto","dora","flora","celso"],
  level3: ["claudete","cris","duda","luca-i","luca-p","luca-t","malu","mila","rafa","sara"]
}

// Cache layer (30s TTL) — avoids hammering filesystem on every tRPC call
// ---------------------------------------------------------------------------

interface CacheEntry<T> { data: T; ts: number }
const cache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL = 30_000

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (entry && Date.now() - entry.ts < CACHE_TTL) return Promise.resolve(entry.data)
  return fn().then((data) => { cache.set(key, { data, ts: Date.now() }); return data })
}

// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Agent SOUL.md / IDENTITY.md parser — extracts role, reportsTo
// ---------------------------------------------------------------------------

interface AgentMeta {
  id: string
  name: string
  role: string
  level: 0 | 1 | 2 | 3
  reportsTo: string | null
  manages: string[]
  requiredSkill?: string
}

// Mapping of known hierarchy relationships from AGENTS.md "Reporto à/ao X"
const REPORT_PATTERNS = [
  /[Rr]eporto\s+(?:à|ao)\s+\*\*(\w+)\*\*/,
  /[Rr]eporto\s+(?:à|ao)\s+(\w+)/,
  /delegad[oa]\s+pel[oa]\s+(\w+)/i,
]

// Known name → agent ID mapping
const NAME_TO_ID: Record<string, string> = {
  'Laura': 'main',
  'Maurício': 'mauricio',
  'Celso': 'celso',
  'Flora': 'flora',
  'Otto': 'otto',
  'Cris': 'cris',
  'Mila': 'mila',
  'Claudete': 'claudete',
}

async function parseAgentMeta(agentDir: string, _agentId: string): Promise<Partial<AgentMeta>> {
  const meta: Partial<AgentMeta> = {}

  // Read IDENTITY.md for name and role
  try {
    const identity = await readFile(join(agentDir, 'workspace', 'IDENTITY.md'), 'utf-8')
    const nameMatch = identity.match(/\*\*Nome:\*\*\s*(.+)/i)
    if (nameMatch) meta.name = nameMatch[1].trim()
    const roleMatch = identity.match(/\*\*Espécie:\*\*\s*(.+)/i)
    if (roleMatch) meta.role = roleMatch[1].trim()
  } catch { /* no IDENTITY.md */ }

  // Read AGENTS.md for reportsTo and requiredSkill
  try {
    const agents = await readFile(join(agentDir, 'workspace', 'AGENTS.md'), 'utf-8')
    for (const pattern of REPORT_PATTERNS) {
      const match = agents.match(pattern)
      if (match) {
        const directorName = match[1]
        meta.reportsTo = NAME_TO_ID[directorName] ?? directorName.toLowerCase()
        break
      }
    }
  } catch { /* no AGENTS.md */ }

  return meta
}

async function buildHierarchy(): Promise<AgentMeta[]> {
  return cached('hierarchy', async () => {
    let agentDirs: string[] = []
    try {
      if (existsSync(AGENTS_DIR)) {
        const entries = await readdir(AGENTS_DIR, { withFileTypes: true })
        agentDirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => e.name)
      }
    } catch {
      // Ignore
    }

    const hierarchy: AgentMeta[] = [{
      id: 'mauricio', name: 'Maurício', role: 'Fundador',
      level: 0, reportsTo: null, manages: [],
    }]

    if (agentDirs.length > 0) {
      const metaList = await Promise.all(
        agentDirs.map((agentId) => parseAgentMeta(join(AGENTS_DIR, agentId), agentId))
      )
      
      agentDirs.forEach((agentId, i) => {
        const meta = metaList[i]
        
        let level: 0 | 1 | 2 | 3 = 2
        let reportsTo = 'main'
        
        if (HIERARCHY_MAP.level0.includes(agentId)) { level = 0; reportsTo = 'mauricio' }
        else if (HIERARCHY_MAP.level1.includes(agentId)) { level = 1; reportsTo = 'laura' }
        else if (HIERARCHY_MAP.level2.includes(agentId)) { level = 2; reportsTo = 'laura' } // Assuming level 2 reports to laura
        else if (HIERARCHY_MAP.level3.includes(agentId)) { level = 3; reportsTo = 'coder' } // Mock reporting, we could refine this further

        // Overwrite with parsed meta if available
        if (meta.reportsTo) {
          reportsTo = meta.reportsTo
        }

        const displayName = meta.name ?? agentId.charAt(0).toUpperCase() + agentId.slice(1)
        const displayRole = meta.role ?? agentId
        
        const finalId = agentId === 'main' ? 'laura' : agentId
        const finalReportsTo = finalId === 'laura' ? 'mauricio' : (reportsTo === 'main' ? 'laura' : reportsTo)

        hierarchy.push({
          id: finalId,
          name: finalId === 'laura' ? 'Laura' : displayName,
          role: finalId === 'laura' ? 'CEO — Orquestradora & SDR' : displayRole,
          level,
          reportsTo: finalReportsTo,
          manages: [],
          requiredSkill: meta.requiredSkill,
        })
      })
    } else {
      // SNAPSHOT FALLBACK
      const snap = await loadSnapshot()
      if (snap) {
        for (const a of snap.agents) {
          if (a.id === 'mauricio') continue
          hierarchy.push({
            id: a.id,
            name: a.name,
            role: a.role,
            level: (a.level as 0 | 1 | 2 | 3),
            reportsTo: a.reportsTo,
            manages: [],
          })
        }
      }
    }

    for (const node of hierarchy) {
      node.manages = hierarchy
        .filter((n) => n.reportsTo === node.id)
        .map((n) => n.id)
    }

    return hierarchy
  })
}

// ---------------------------------------------------------------------------
// Agent skills parser — reads AGENTS.md "Skills Mandatórias" section
// ---------------------------------------------------------------------------

const SKILL_PATH_PATTERN = /skills\/([a-z0-9_-]+)\/SKILL\.md/g

async function extractAgentSkills(agentDir: string): Promise<string[]> {
  try {
    const content = await readFile(join(agentDir, 'workspace', 'AGENTS.md'), 'utf-8')

    // Find skills section
    const skillsSection = content.match(/## Skills Mandatórias[\s\S]*?(?=\n## |\n---|$)/i)
    if (!skillsSection) return []

    const skills: string[] = []
    let match: RegExpExecArray | null
    const pattern = new RegExp(SKILL_PATH_PATTERN.source, 'g')
    while ((match = pattern.exec(skillsSection[0])) !== null) {
      if (match[1] && !skills.includes(match[1])) {
        skills.push(match[1])
      }
    }
    return skills
  } catch {
    return []
  }
}

async function buildAgentSkillsMap(): Promise<Record<string, string[]>> {
  return cached('agent-skills', async () => {
    const map: Record<string, string[]> = {}

    let hasFilesystem = false
    let agentDirs: string[] = []
    try {
      if (existsSync(AGENTS_DIR)) {
        const entries = await readdir(AGENTS_DIR, { withFileTypes: true })
        agentDirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => e.name)
        hasFilesystem = agentDirs.length > 0
      }
    } catch { /* empty */ }

    if (hasFilesystem) {
      const results = await Promise.all(
        agentDirs.map(async (agentId) => {
          const hierarchyId = agentId === 'main' ? 'laura' : agentId
          return { id: hierarchyId, skills: await extractAgentSkills(join(AGENTS_DIR, agentId)) }
        })
      )
      for (const res of results) map[res.id] = res.skills
    } else {
      // SNAPSHOT FALLBACK
      const snap = await loadSnapshot()
      if (snap) {
        for (const a of snap.agents) {
          if (a.id !== 'mauricio') map[a.id] = a.skills
        }
      }
    }

    return map
  })
}

// Gateway ID ↔ Hierarchy ID mapping (built dynamically)
async function buildGatewayMapping(): Promise<Record<string, string>> {
  return cached('gateway-map', async () => {
    const map: Record<string, string> = {}
    try {
      if (existsSync(AGENTS_DIR)) {
        const entries = await readdir(AGENTS_DIR, { withFileTypes: true })
        for (const e of entries) {
           if (e.isDirectory() && !e.name.startsWith('.')) {
             map[e.name] = e.name === 'main' ? 'laura' : e.name
           }
        }
      }
    } catch { /* empty */ }
    return map
  })
}

// ---------------------------------------------------------------------------
// Workspace skills scanner (already existed — kept as-is)
// ---------------------------------------------------------------------------

async function scanWorkspaceSkills(): Promise<string[]> {
  try {
    const entries = await readdir(WORKSPACE_SKILLS_DIR, { withFileTypes: true })
    const skills = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
      .map((e) => e.name)
    if (skills.length > 0) return skills
  } catch {
    // Filesystem unavailable — fall through to snapshot
  }
  // SNAPSHOT FALLBACK
  const snap = await loadSnapshot()
  return snap?.workspaceSkills ?? []
}

// ---------------------------------------------------------------------------
// Workflow cycles (kept static — these are business-defined schedules)
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
// Token costs (mock data — will be replaced with real tracking later)
// ---------------------------------------------------------------------------

const MONTHLY_BUDGET = 10_000
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
    const [hierarchyTemplate, gatewayMap, agentSkills] = await Promise.all([
      buildHierarchy(),
      buildGatewayMapping(),
      buildAgentSkillsMap(),
    ])

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

    const activeGatewayIds = new Set(
      liveSessions.map((s) => String(s.agentId ?? ''))
    )

    return hierarchyTemplate.map((tmpl): AgentNode => {
      const gatewayId = Object.entries(gatewayMap)
        .find(([, hId]) => hId === tmpl.id)?.[0]

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
        skills: agentSkills[tmpl.id] ?? [],
        tools: [] as string[],
      })
    })
  }),

  /** Skills map — workspace skills × assigned agents (dynamic) */
  skillsMap: publicProcedure.query(async (): Promise<SkillEntry[]> => {
    const [workspaceSkills, agentSkills] = await Promise.all([
      scanWorkspaceSkills(),
      buildAgentSkillsMap(),
    ])

    const allSkillNames = new Set(workspaceSkills)
    for (const skills of Object.values(agentSkills)) {
      for (const skill of skills) {
        allSkillNames.add(skill)
      }
    }

    const skillToAgents: Record<string, string[]> = {}
    for (const skill of allSkillNames) {
      skillToAgents[skill] = []
    }
    for (const [agentId, skills] of Object.entries(agentSkills)) {
      for (const skill of skills) {
        if (!skillToAgents[skill]) skillToAgents[skill] = []
        skillToAgents[skill].push(agentId)
      }
    }

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

  /** Aggregated alerts (dynamic) */
  alerts: publicProcedure.query(async (): Promise<AlertItem[]> => {
    const [allSkills, agentSkills] = await Promise.all([
      scanWorkspaceSkills(),
      buildAgentSkillsMap(),
    ])
    const alerts: AlertItem[] = []

    const assignedSkills = new Set(Object.values(agentSkills).flat())
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
