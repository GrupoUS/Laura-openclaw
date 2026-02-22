// Orchestration types — hierarchy, skills, tools, tokens, workflows

export type AgentStatus = 'active' | 'idle' | 'offline' | 'in_workflow'

export interface AgentNode {
  id: string
  name: string
  role: string
  level: 0 | 1 | 2 | 3
  reportsTo: string | null
  manages: string[]
  status: AgentStatus
  skills: string[]
  tools: string[]
  requiredSkill?: string
  tokensUsed?: number
  lastActive?: string
  currentAction?: string
}

export interface SkillEntry {
  name: string
  assignedAgents: string[]
  unassigned: boolean
}

export interface ToolEntry {
  name: string
  usedByAgents: string[]
  unused: boolean
}

export interface TokenCost {
  squad: string
  director: string
  tokens: number
  cost: number
  budgetPercent: number
}

export interface WorkflowCycle {
  weekday: string
  steps: Array<{ agent: string; action: string; time?: string }>
}

export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertType = 'unassigned_skill' | 'token_overload' | 'coverage_gap'

export interface AlertItem {
  type: AlertType
  severity: AlertSeverity
  title: string
  detail: string
}
