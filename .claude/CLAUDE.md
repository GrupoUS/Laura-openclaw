# CLAUDE.md — Claude Code Orchestrator

> **Role**: Intelligent coordinator for agents, skills, and commands
> **Project Rules**: @../AGENTS.md

---

## 1. Quick Reference

| Layer    | Technology                    |
| -------- | ----------------------------- |
| Runtime  | Bun (package manager + runtime + bundler) |
| Frontend | React 19 + Vite 7 + Tailwind CSS 4 + shadcn/ui |
| Backend  | Hono + tRPC 11 + Drizzle ORM  |
| Database | Neon PostgreSQL               |
| Auth     | Clerk                         |

---

## 2. Commands

| Task                 | Command              |
| -------------------- | -------------------- |
| Install dependencies | `bun install`        |
| Start development    | `bun dev`            |
| Type check           | `bun run check`      |
| Lint + format check  | `bun run lint:check` |
| Run tests            | `bun run test`       |
| Push DB schema       | `bun run db:push`    |

> **Package Manager**: This project uses **Bun only**. Never use npm, yarn, or pnpm.

---

## 3. Context Loading Protocol

Load rules files in this order (lazy loading for context efficiency):

1. **Root AGENTS.md** — Always load first. Contains project-wide rules.
2. **Subdirectory AGENTS.md** — Load only when editing files in that directory:
   - `apps/api/src/AGENTS.md` — Backend (Hono, tRPC)
   - `apps/api/drizzle/AGENTS.md` — Database schema
   - `apps/api/src/services/AGENTS.md` — Meta/WhatsApp services
   - `apps/web/src/AGENTS.md` — Frontend (React, shadcn)
   - `packages/AGENTS.md` — Workspace packages
   - `packages/ai-gateway/AGENTS.md` — AI Gateway

### Authority Precedence

When rules conflict:

1. `.agent/skills/*/SKILL.md` — Domain authority (non-overridable)
2. Subdirectory `AGENTS.md` — Domain-specific rules
3. Root `AGENTS.md` — Project-wide rules
4. This file — Claude Code specific guidance

---

## 4. Commands Workflow

### /plan — Planning Workflow

**Trigger:** Creating implementation plans, new features, architecture design

| Complexity | Research Agents | Pattern |
|------------|-----------------|---------|
| **L1-L2** | Skip | Direct fix |
| **L3** | 1 explorer-agent | Single research |
| **L4-L5** | 2-3 explorers (parallel) | Multi-domain research |
| **L6+** | 3-5 explorers (parallel) | Full research swarm |

**Flow:** `Research (parallel) → Consolidate (project-planner) → Present`

### /implement — Implementation Workflow

**Trigger:** Executing plans, building features

| Complexity | Mode | Pattern |
|------------|------|---------|
| **L1-L2** | DIRECT | Single agent, no spawn |
| **L3-L5** | SUBAGENTS | Parallel Task() spawns |
| **L6+** | AGENT TEAMS | orchestrator + teammates |

**Flow:** `Analyze → Select mode → Execute → Validate`

### /debug — Debugging Workflow

**Trigger:** Bugs, errors, crashes, test failures

| Complexity | Pattern | Agent |
|------------|---------|-------|
| **L1-L2** | Direct fix | No agent needed |
| **L3** | Single agent | `debugger` |
| **L4-L5** | Parallel hypotheses | Multiple specialists |
| **L6+** | Agent Team | Full investigation swarm |

**Phases:** `Collect errors → Root cause → Hypothesis test → Fix → Verify`

### /design — Design Workflow

**Trigger:** UI components, pages, styling

| Complexity | Pattern | Agent |
|------------|---------|-------|
| **L1-L2** | Direct code | No agent |
| **L3** | Single agent | `frontend-specialist` |
| **L4-L5** | Design + Review (parallel) | frontend + test + perf |
| **L6+** | Agent Team | Full design team |

**Phases:** `Prototype (Stitch) → Convert (React) → Validate`

---

## 5. Skills System

| Domain | Skill | When to Invoke |
|--------|-------|----------------|
| Backend/Hono/tRPC | `backend-design` | API patterns, procedures, middleware |
| Database/Drizzle/Neon | `clerk-neon-auth` | Schema, migrations, auth |
| Frontend/React/shadcn | `frontend-rules` | GPUS tokens, components, styling |
| Creative UI Design | `frontend-design@claude-plugins-official` | Distinctive interfaces |
| Docker/Deploy | `docker-deploy` | CI/CD, containers, VPS |
| Meta APIs/WhatsApp | `meta-api-integration` | Instagram, Facebook, WhatsApp |
| Baileys/WhatsApp | `baileys-integration` | WhatsApp Web integration |
| Debugging | `debugger` | Root cause analysis |
| Planning | `planning` | D.R.P.I.V methodology |
| Security | `security-audit` | Vulnerabilities, OWASP |
| Performance | `performance-optimization` | Profiling, Core Web Vitals |
| Testing | `webapp-testing` | E2E, unit tests |
| SEO | `seo-optimization` | Search visibility |

> **Important**: If there is even a 1% chance a skill applies, invoke it BEFORE taking action.

---

## 6. Agent Types (`.claude/agents/`)

### Core Specialists

| Agent | Role | Skills | Parallel With |
|-------|------|--------|--------------|
| `orchestrator` | Team Lead | planning, brainstorming | — |
| `backend-specialist` | Backend/API | backend-design, clerk-neon-auth | frontend, test, security |
| `frontend-specialist` | UI/Frontend | frontend-rules, frontend-design, gpus-theme | backend, test, security |
| `database-architect` | Database | clerk-neon-auth | backend |
| `debugger` | Debugging | debugger, docker-deploy | — |

### Support Specialists

| Agent | Role | Skills | Parallel With |
|-------|------|--------|--------------|
| `test-engineer` | Testing | webapp-testing | backend, frontend |
| `security-auditor` | Security | security-audit | backend, frontend |
| `performance-optimizer` | Performance | performance-optimization | backend, frontend |
| `devops-engineer` | Deploy/Infra | docker-deploy | backend |
| `code-reviewer` | Review | — | security, performance |

### Research & Planning

| Agent | Role | Skills | Parallel With |
|-------|------|--------|--------------|
| `explorer-agent` | Discovery | planning, Context7, Tavily | any agent |
| `project-planner` | Plan synthesis | planning, writing-plans | — |

---

## 7. Parallel Execution (Default Behavior)

**RULE: When a task has 2+ independent components, use parallel subagents.**

### Decision Tree

```
START
  │
  ├─► Is task PARALLELIZABLE?
  │     ├─► Independent investigations → YES → Spawn parallel
  │     ├─► Multiple domains affected → YES → Spawn parallel
  │     ├─► Code review from angles → YES → Spawn parallel
  │     └─► Single focused task → NO → Single agent
  │
  └─► Choose execution mode:
        ├─► L1-L2 → DIRECT (no spawn)
        ├─► L3-L5 → SUBAGENTS (Task with run_in_background)
        └─► L6+ → AGENT TEAMS (TeamCreate + TaskCreate)
```

### Parallel Patterns

#### Pattern 1: Research (Parallel)
```typescript
Task({ subagent_type: "explorer-agent", name: "codebase", run_in_background: true })
Task({ subagent_type: "explorer-agent", name: "docs", run_in_background: true })
Task({ subagent_type: "explorer-agent", name: "security", run_in_background: true })
```

#### Pattern 2: Debugging Hypotheses (Parallel)
```typescript
Task({ subagent_type: "backend-specialist", prompt: "Test hypothesis: auth issue", run_in_background: true })
Task({ subagent_type: "backend-specialist", prompt: "Test hypothesis: DB query", run_in_background: true })
Task({ subagent_type: "frontend-specialist", prompt: "Test hypothesis: state issue", run_in_background: true })
```

#### Pattern 3: Multi-Domain Implementation (Agent Teams)
```typescript
TeamCreate({ team_name: "implement-feature" })
TaskCreate({ subject: "Backend API", owner: "backend-specialist" })
TaskCreate({ subject: "Frontend UI", owner: "frontend-specialist" })
TaskCreate({ subject: "Tests", owner: "test-engineer" })
```

### When NOT to Parallelize

- Sequential tasks (A depends on B)
- Same file modifications
- Tasks < 5 min each (overhead > benefit)

### Subagents vs Agent Teams

| Characteristic | Subagents | Agent Teams |
|----------------|-----------|-------------|
| Context | Own (stays clean) | Own (per teammate) |
| Communication | Returns to main | Peer-to-peer |
| Cost | Lower | Higher |
| Use | **Default** - independent ops | Complex coordination |
| Setup | `run_in_background: true` | TeamCreate + TaskCreate |

---

## 8. Complexity Level Guide

| Level | Indicators | Recommended Workflow |
|-------|------------|---------------------|
| L1-L2 | Bug fix, single function | `/plan` + `/implement` (DIRECT) |
| L3 | Multi-file feature | `/plan` + `/implement` (SUBAGENTS) |
| L4-L5 | Complex feature, integration | `/plan` + `/implement` (SUBAGENTS/TEAMS) |
| L6-L8 | Architecture, multi-service | `/plan` + `/implement` (AGENT TEAMS) |

### Agent Teams Setup

Enable in `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

---

## 9. Debugging Protocol

### Phase 0: Collect All Errors (ALWAYS first)

```bash
# Local
bun run check 2>&1 | tail -30
bun test 2>&1 | tail -30

# CI/CD
gh run list --repo GrupoUS/neondash -L 5

# VPS
ssh root@31.97.170.4 "docker logs app --tail 50"
```

### Phase 1: Root Cause

- Read error messages completely
- Reproduce the issue
- Identify affected layer
- Trace data flow backward

### Phase 2: Hypothesis Testing (L4+)

For complex bugs, test competing hypotheses in PARALLEL:

```
Form 2-3 competing hypotheses.
Test each with separate subagent in parallel.
Converge on the one that survives.
```

### Phase 3: Fix & Verify

- Single focused fix addressing root cause
- Run quality gates: `bun run check && bun run lint:check && bun test`

---

## 10. MCP Tools Available

| Tool | Purpose |
|------|---------|
| Context7 | Official library docs |
| Tavily | Web search and URL extraction |
| Clerk Snippets | Official Clerk patterns |
| Sequential Thinking | Complex logical problems |
| Serena | Symbolic code editing |

> **Note**: `mcp-server-neon` is DEACTIVATED. Use `neonctl` CLI for Neon operations.

---

## 11. Available Plugins

| Plugin | Purpose | Usage |
|--------|---------|-------|
| `code-review@claude-plugins-official` | Automated code review | `Skill("code-review")` |
| `frontend-design@claude-plugins-official` | Creative UI design | Distinctive interfaces |
| `context7@claude-plugins-official` | Library docs lookup | Automatic for queries |
| `serena@claude-plugins-official` | Symbolic code editing | Precise refactoring |

### Superpowers Framework

| Skill | When to Use |
|-------|-------------|
| `superpowers:brainstorming` | Before any creative work |
| `superpowers:writing-plans` | Breaking design into tasks |
| `superpowers:test-driven-development` | RED-GREEN-REFACTOR cycle |
| `superpowers:systematic-debugging` | 4-phase root cause analysis |
| `superpowers:verification-before-completion` | Verify fix before done |
| `superpowers:subagent-driven-development` | Execute with agent teams |

---

## 12. Quality Gates

### After Each Task

```bash
bun run check       # TypeScript
bun run lint:check  # Biome
bun test            # Tests
```

### Skill Invocation Protocol

Before ANY task, complete this checklist:

1. ☐ List available skills in your mind
2. ☐ Ask: "Does ANY skill match this request?"
3. ☐ If yes → Use Skill tool to invoke it
4. ☐ Announce: "I'm using [skill] to [purpose]"
5. ☐ Follow the skill exactly

**Responding WITHOUT this checklist = skipping process.**

### Rationalization Prevention

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I can check git/files quickly" | Files don't have conversation context. Check skills. |
| "Let me gather information first" | Skills tell you HOW to gather. Check first. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "The skill is overkill" | Simple things become complex. Use it. |

### Red Flags — STOP

- Proposing fixes before root cause found
- Multiple changes at once
- "Just try this and see"
- Skipping reproduction steps
- Starting on `main`/`master` without consent
