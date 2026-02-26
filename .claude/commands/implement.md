---
description: Execute implementation plans created by orchestrator. Parses plan for agent assignments, handles parallel/sequential phases, spawns correct specialist per task.
---

# /implement — Execution Engine

$ARGUMENTS

> **Plans come from:** `orchestrator` with D.R.P.I.V methodology
> **Plan format:** `docs/plans/YYYY-MM-DD-<feature>.md`

---

## 0. Pre-flight Check

### Verify Plan Exists

```bash
# Check for plan files
ls docs/plans/*.md 2>/dev/null || ls PLAN-*.md 2>/dev/null
```

| Source           | Action                                        |
| ---------------- | --------------------------------------------- |
| **File exists**  | Load `docs/plans/YYYY-MM-DD-*.md`             |
| **Chat context** | Extract tasks from current conversation       |
| **None found**   | **Suggest `/plan` first**                     |

---

## 1. Parse Plan Structure

### Extract from Plan File

```markdown
# [Feature Name] Implementation Plan

**Goal:** ...
**Complexity:** L[1-10]

### Phase 1: Foundation [SEQUENTIAL]

### Task 1: [Name]
**Files:** `path/file.ts:123-145`
**Agent:** `debugger`
**Dependencies:** None ⚡ PARALLEL-SAFE
...

### Phase 2: Core [PARALLEL]
> ⚡ PARALLEL-SAFE

### Task 2: [Name]
**Agent:** `frontend-specialist`
...
```

### Parse Rules

1. **Complexity Level** → Determines execution mode
2. **Phase Type** → `[SEQUENTIAL]` or `[PARALLEL]`
3. **Agent Assignment** → `**Agent:** \`agent-name\``
4. **Dependencies** → Order or parallelize tasks

---

## 2. Mode Selection

| Complexity | Mode        | Action                            |
| ---------- | ----------- | --------------------------------- |
| **L1-L2**  | DIRECT      | Execute in main agent             |
| **L3-L5**  | SUBAGENTS   | `Task()` with `run_in_background` |
| **L6+**    | AGENT TEAMS | `TeamCreate` + `TaskCreate`       |

---

## 3. Agent Assignment Matrix

| Task Type                    | Agent                   | Skills                                              |
| ---------------------------- | ----------------------- | --------------------------------------------------- |
| tRPC, Hono, auth, DB         | `debugger`              | debugger, meta-api-integration, baileys-integration |
| React, components, UI        | `frontend-specialist`   | debugger, frontend-design, gpus-theme, ui-ux-pro-max |
| Schema, migrations, indexes  | `debugger`              | debugger                                            |
| Tests, QA, CI/CD             | `debugger`              | debugger, docker-deploy                             |
| Performance, security, SEO   | `performance-optimizer` | performance-optimization                            |
| Documentation (notion, xlsx) | `orchestrator`          | notion, xlsx                                        |
| Research, discovery          | `explorer-agent`        | planning                                            |
| Architecture consultation    | `oracle`                | read-only analysis                                  |

**Rule:** Every task in the plan MUST specify `**Agent:**`. If missing, use domain detection above.

---

## 4. Mode A: DIRECT (L1-L2)

Single domain, 1-3 tasks, no parallelism needed.

```bash
# Execute tasks directly, run gates after each
bun run check && bun run lint:check && bun test
```

---

## 5. Mode B: SUBAGENTS (L3-L5)

Multi-domain, parallel tasks, no complex dependencies.

### Sequential Phase Execution

```typescript
// SEQUENTIAL phase - execute one at a time
for (const task of phase1Tasks) {
  await Task({
    subagent_type: task.agent, // From **Agent:** field
    prompt: `Execute: ${task.name}

FILE: ${task.file}
${task.code}

Run: bun run check && bun run lint:check`,
    run_in_background: false, // Sequential
  });
}
```

### Parallel Phase Execution

```typescript
// PARALLEL phase - spawn all simultaneously
const parallelTasks = phase2Tasks.map(task =>
  Task({
    subagent_type: task.agent, // From **Agent:** field
    prompt: `Execute: ${task.name}

FILE: ${task.file}
${task.code}

Run: bun run check && bun run lint:check`,
    run_in_background: true, // Parallel background task
  })
);

// Wait for all and collect background output
await Promise.all(parallelTasks.map(id => background_output(id)));
```

### PARALLEL-FIRST Default

Always spawn parallel when tasks are in a `[PARALLEL]` phase or marked `⚡ PARALLEL-SAFE`:

```typescript
// Spawn ALL parallel tasks in single message (one tool call block)
Task({ subagent_type: "debugger", prompt: "...", run_in_background: true });
Task({ subagent_type: "frontend-specialist", prompt: "...", run_in_background: true });
// Wait for background outputs before proceeding to next phase
```

> Rule: `run_in_background: true` is MANDATORY for all parallel tasks.
> Never spawn parallel tasks sequentially — that defeats the purpose.

### Complete Spawn Pattern

```typescript
// Example: Plan with mixed phases

// Phase 1: Foundation [SEQUENTIAL]
await Task({
  subagent_type: "debugger",
  prompt: `Execute: Create database schema...`,
  run_in_background: false,
});

// Phase 2: Core [PARALLEL]
// ⚡ PARALLEL-SAFE
Task({ subagent_type: "debugger", prompt: `Execute: API endpoint...`, run_in_background: true });
Task({ subagent_type: "frontend-specialist", prompt: `Execute: UI component...`, run_in_background: true });

// Wait for parallel tasks, then continue
// Phase 3: Integration [SEQUENTIAL]
await Task({
  subagent_type: "debugger",
  prompt: `Execute: Integration tests...`,
  run_in_background: false,
});

// Final quality gates
bun run check && bun run lint:check && bun test
```

---

## 6. Mode C: AGENT TEAMS (L6+)

4+ domains, complex dependencies, requires coordination.

### Orchestrator Pattern

```typescript
// 1. Create Team
TeamCreate({
  team_name: "implement-feature",
  description: "Multi-domain development team for feature X",
});

// 2. Create Tasks with Dependencies (from plan)
// Parse plan for dependencies
TaskCreate({
  subject: "Backend API",
  description: "Create /users endpoint",
  addBlocks: ["frontend-ui"], // Blocks frontend
});
TaskCreate({
  subject: "Frontend UI",
  description: "Build users table",
  addBlockedBy: ["backend-api"], // Depends on backend
});
TaskCreate({
  subject: "Database Migration",
  description: "Create users table",
  // No dependencies - parallelizable
});

// 3. Assign Tasks to Specialists (from **Agent:** field)
TaskUpdate({ taskId: "Database Migration", owner: "debugger" });
TaskUpdate({ taskId: "Backend API", owner: "debugger" });
TaskUpdate({ taskId: "Frontend UI", owner: "frontend-specialist" });

// 4. Enter Delegate Mode (Coordination Only)
// Press Shift+Tab to enter Delegate Mode
```

### Team Operations & Communication

```typescript
// Direct Message
SendMessage({
  type: "message",
  recipient: "debugger",
  content: "Database schema is ready.",
});

// Broadcast (Critical Blockers Only)
SendMessage({
  type: "broadcast",
  content: "Changing API response format, please hold.",
});

// Graceful Shutdown
SendMessage({
  type: "shutdown_request",
  recipient: "debugger",
  content: "Work complete",
});

// Cleanup
TeamDelete();
```

---

## 7. Execution Flow

```
1. PARSE plan → Extract: complexity, phases, tasks, agents, dependencies
2. SELECT mode → Based on complexity (L1-L10)
3. SPAWN agents → Based on **Agent:** field in each task
4. EXECUTE phases → Sequential or parallel per plan
5. VALIDATE → Run quality gates after each phase
6. COMPLETE → Present options to user
```

### Phase Execution Order

```markdown
### Phase 1: Foundation [SEQUENTIAL]
→ Execute tasks one-by-one, wait for each

### Phase 2: Core [PARALLEL]
> ⚡ PARALLEL-SAFE
→ Spawn all tasks simultaneously, wait for all

### Phase 3: Integration [SEQUENTIAL]
→ Execute tasks one-by-one, wait for each
```

---

## 8. Quality Gates

```bash
# After each task/phase
bun run check       # TypeScript
bun run lint:check  # Biome (format) + OXLint (lint)
bun test            # Vitest

# Combined
bun run check && bun run lint:check && bun test
```

### Gate Enforcement

- **After each task:** Run `bun run check` (quick)
- **After each phase:** Run `bun run check && bun run lint:check`
- **Final:** Run full suite `bun run check && bun run lint:check && bun test`

### Gate Timing

- **After each task:** `bun run check` (fast TypeScript gate)
- **After each [SEQUENTIAL] phase:** `bun run check && bun run lint:check`
- **After all [PARALLEL] tasks complete:** `bun run check && bun run lint:check`
- **Final:** `bun run check && bun run lint:check && bun test`

---

## 9. Failure Handling

1. **Pause** — Don't retry immediately
2. **Identify** — Which task failed?
3. **Debug** — Run `/debug` workflow
4. **Fix** — Minimal, targeted fix
5. **Verify** — Re-run gates before continuing

### Retry Policy

| Failure Count | Action |
|---------------|--------|
| 1st | Retry same task |
| 2nd | Break into smaller tasks |
| 3rd | Switch mode OR escalate to oracle |

---

## 10. Cleanup (Agent Teams)

```typescript
// Graceful shutdown all teammates
SendMessage({ type: "shutdown_request", recipient: "debugger", content: "Complete" });
SendMessage({ type: "shutdown_request", recipient: "frontend-specialist", content: "Complete" });
// ... for all teammates

// After confirmations
TeamDelete();
```

---

## 11. Completion Options

After all tasks pass gates, present:

```
✅ Implementation complete!

📊 Summary:
  - Tasks completed: {N}
  - Phases: {sequential_count} sequential, {parallel_count} parallel
  - Agents used: debugger, frontend-specialist

What would you like to do?

1. **Merge back to <base-branch> locally**
2. **Push and create a Pull Request**
3. **Keep the branch as-is**
4. **Discard this work**

Which option?
```

| Option     | Actions                                                                                 |
| ---------- | --------------------------------------------------------------------------------------- |
| 1. Merge   | `git checkout base && git pull && git merge branch && bun test && git branch -d branch` |
| 2. PR      | `git push -u origin branch && gh pr create`                                             |
| 3. Keep    | Report branch name                                                                      |
| 4. Discard | Require "discard" confirmation → `git branch -D branch`                                 |

---

## 12. Próximos Passos (Pós-Implementação)

```
✅ Implementação completa!

Próximos passos:
1. /evolve → Capturar aprendizados (recomendado)
2. Testar em staging → Validar em ambiente real
3. Documentar → Atualizar README se necessário
```

O `/evolve` irá registrar padrões úteis e atualizar documentação.

---

## Quick Reference Card

```
/implement workflow:

PARSE → SELECT MODE → SPAWN AGENTS → EXECUTE PHASES → VALIDATE → COMPLETE

Complexity → Mode:
  L1-L2  → DIRECT (main agent)
  L3-L5  → SUBAGENTS (Task with run_in_background)
  L6+    → AGENT TEAMS (TeamCreate + TaskCreate)

Agent Routing:
  **Agent:** `debugger` → Task({ subagent_type: "debugger" })
  **Agent:** `frontend-specialist` → Task({ subagent_type: "frontend-specialist" })

Phase Execution:
  [SEQUENTIAL] → One at a time
  [PARALLEL]   → All at once (run_in_background: true as parallel task)

Quality Gates:
  After task  → bun run check
  After phase → bun run check && bun run lint:check
  Final       → bun run check && bun run lint:check && bun test
```

---

## References

- **orchestrator.md** — Plan creation with D.R.P.I.V methodology
- **CLAUDE.md** — Orchestration, agent types, skill routing
- **planning skill** — D.R.P.I.V workflow reference
- **debugger skill** — Failure handling + Iron Law verification
