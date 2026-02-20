---
description: Unified planning workflow using parallel explorer-agents for research and project-planner for synthesis. Delegates to planning skill for methodology.
---

# /plan — Planning Orchestration

$ARGUMENTS

> **Methodology:** `Skill("planning")` — D.R.P.I.V workflow
> **Executor:** `.claude/agents/project-planner.md` — Plan synthesis

---

## Quick Assessment

```
Is it L1-L2 (bug fix, single file)?
├─► YES → Skip /plan, fix directly
└─► NO  → Continue workflow
```

---

## Workflow

```
DISCOVER → RESEARCH → CONSOLIDATE → PRESENT
    ↓          ↓           ↓           ↓
  Skill    Parallel     Planner     Handoff
           Agents
```

---

### Phase 1: DISCOVER

**Trigger:** Requirements unclear, new feature, L6+

```typescript
Skill("planning")  // Loads brainstorming protocol
```

**Skip if:** Request is crystal-clear and well-scoped.

---

### Phase 2: RESEARCH

**Spawn explorer-agents based on complexity:**

| Complexity | Agents | Parallel? |
|------------|--------|-----------|
| L3 | 1 explorer-agent | No |
| L4-L5 | 2-3 explorer-agents | **YES** |
| L6-L8 | 3-5 explorer-agents | **YES** |
| L9-L10 | 5+ explorer-agents | **MANDATORY** |

#### L3: Single Domain
```typescript
Task({
  subagent_type: "explorer-agent",
  prompt: `Research [topic] in codebase.
  Return: Findings table with confidence scores (1-5)`
})
```

#### L4-L5: Multi-Domain (Parallel)
```typescript
Task({ subagent_type: "explorer-agent", name: "codebase-research",
  prompt: `Research codebase for [feature]...`, run_in_background: true })
Task({ subagent_type: "explorer-agent", name: "docs-research",
  prompt: `Research official docs via Context7...`, run_in_background: true })
Task({ subagent_type: "explorer-agent", name: "best-practices",
  prompt: `Research best practices via Tavily...`, run_in_background: true })
```

#### L6+: Full Research Swarm
```typescript
Task({ subagent_type: "explorer-agent", name: "codebase", run_in_background: true })
Task({ subagent_type: "explorer-agent", name: "docs-official", run_in_background: true })
Task({ subagent_type: "explorer-agent", name: "security", run_in_background: true })
Task({ subagent_type: "explorer-agent", name: "performance", run_in_background: true })
```

---

### Phase 3: CONSOLIDATE

**After research complete, spawn project-planner:**

```typescript
Task({
  subagent_type: "project-planner",
  prompt: `Create implementation plan for: [user request]

## Research Findings
[Paste findings from explorer-agents]

## Requirements
[From discovery phase]

## Output
docs/plans/YYYY-MM-DD-<feature-name>.md

Use Skill("planning") for methodology.`
})
```

---

### Phase 4: PRESENT

```
✅ Plan created: docs/plans/YYYY-MM-DD-<feature-name>.md

📊 Complexity: L{X} | Tasks: {N} | Parallel: {M}

📋 Next:
1. /implement → Execute the plan
2. Review → Open plan file
3. Modify → Adjust before execution
```

---

## Agent Team Alternative (L6+)

For complex cross-layer work:

```typescript
TeamCreate({ team_name: "plan-{slug}" })

TaskCreate({ subject: "Backend research", owner: "backend-specialist" })
TaskCreate({ subject: "Frontend research", owner: "frontend-specialist" })
TaskCreate({ subject: "Database research", owner: "database-architect" })
TaskCreate({ subject: "Security review", owner: "security-auditor" })
TaskCreate({ subject: "Create plan", owner: "project-planner" })

TaskUpdate({ taskId: "1", owner: "backend-specialist" })
TaskUpdate({ taskId: "2", owner: "frontend-specialist" })
TaskUpdate({ taskId: "3", owner: "database-architect" })
TaskUpdate({ taskId: "4", owner: "security-auditor" })
TaskUpdate({ taskId: "5", owner: "project-planner" })
```

---

## Quick Reference

```
/plan → Skill("planning") → Research (parallel) → Planner → Present

L1-L2  → Direct fix (no /plan)
L3     → 1 explorer → project-planner
L4-L5  → 2-3 explorers (parallel) → project-planner
L6-L8  → 3-5 explorers (parallel) → project-planner OR Team
L9-L10 → 5+ explorers (mandatory parallel) → Team
```

---

## References

- **Methodology:** `.claude/skills/planning/SKILL.md`
- **Executor:** `.claude/agents/project-planner.md`
- **Researcher:** `.claude/agents/explorer-agent.md`
- **Implementation:** `.claude/commands/implement.md`
