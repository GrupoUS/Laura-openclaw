import { create } from 'zustand'

export interface AgentSkillUsage {
  count: number
  lastUsed: Date
  agentId: string
}

export interface LiveAgentState {
  status: string
  currentAction: string
  skillsActive: Record<string, AgentSkillUsage>
}

interface OrchestrationStore {
  liveAgentMap: Map<string, LiveAgentState>
  liveCounter: Map<string, AgentSkillUsage>
  pushAgentStatus: (agentId: string, status: string, currentAction: string) => void
  pushAgentSkill: (agentId: string, skill: string, ts: string) => void
}

export const useOrchestrationEvents = create<OrchestrationStore>((set) => ({
  liveAgentMap: new Map(),
  liveCounter: new Map(),

  pushAgentStatus: (agentId, status, currentAction) => set((s) => {
    const newMap = new Map(s.liveAgentMap)
    const existing = newMap.get(agentId) ?? { status: 'idle', currentAction: '', skillsActive: {} }
    newMap.set(agentId, { ...existing, status, currentAction })
    return { liveAgentMap: newMap }
  }),

  pushAgentSkill: (agentId, skill, ts) => set((s) => {
    const newMap = new Map(s.liveAgentMap)
    const newCounter = new Map(s.liveCounter)
    
    // update global counter
    const existingCount = newCounter.get(skill) ?? { count: 0, lastUsed: new Date(0), agentId }
    newCounter.set(skill, {
      count: existingCount.count + 1,
      lastUsed: ts ? new Date(ts) : new Date(),
      agentId
    })

    // update agent map
    const existingAgent = newMap.get(agentId) ?? { status: 'idle', currentAction: '', skillsActive: {} }
    const skillsActive = { ...existingAgent.skillsActive }
    const agentSkillCount = skillsActive[skill] ?? { count: 0, lastUsed: new Date(0), agentId }
    skillsActive[skill] = {
      count: agentSkillCount.count + 1,
      lastUsed: ts ? new Date(ts) : new Date(),
      agentId
    }
    newMap.set(agentId, { ...existingAgent, skillsActive })

    return { liveAgentMap: newMap, liveCounter: newCounter }
  })
}))
