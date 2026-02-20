---
description: Execute implementation plans using subagents or Agent Teams based on complexity.
---

# /implement — Execution Engine

$ARGUMENTS

> **Orchestration & agent selection:** See `CLAUDE.md` §4-7

---

## 1. Plan Source Detection

| Source | Action |
|--------|--------|
| **File exists** | Load `docs/PLAN-*.md` or `./PLAN-*.md` |
| **Chat context** | Extract tasks from current conversation |
| **None found** | Suggest `/plan` first, or create tasks ad-hoc |

---

## 2. Mode Selection (Quick Reference)

| Complexity | Mode | Action |
|------------|------|--------|
| **L1-L2** | DIRECT | Execute in main agent |
| **L3-L5** | SUBAGENTS | `Task()` with `run_in_background` |
| **L6+** | AGENT TEAMS | `TeamCreate` + `TaskCreate` |

> See `CLAUDE.md` §4 for decision tree, §6 for agent types, §5 for skill routing

---

## 3. Mode A: DIRECT (L1-L2)

Single domain, 1-3 tasks, no parallelism needed.

```bash
# Execute tasks directly, run gates after each
bun run check && bun run lint:check && bun test
```

---

## 4. Mode B: SUBAGENTS (L3-L5)

Multi-domain, parallel tasks, no complex dependencies.

### Spawn Pattern

```typescript
// PARALLEL execution
await Promise.all([
  Task({
    subagent_type: "backend-specialist",
    prompt: `Execute: [task from plan]

    FILE: path/to/file.ts:10-25
    Include complete code. Run: bun run check && bun run lint:check`
  }),
  Task({
    subagent_type: "frontend-specialist",
    prompt: `Execute: [task from plan]...`,
    run_in_background: true  // Parallel with others
  }),
  Task({
    subagent_type: "test-engineer",
    prompt: `Execute: [task from plan]...`,
    run_in_background: true
  })
]);

// Quality gates after all complete
// Run: bun run check && bun run lint:check && bun test
```

### Subagent Types (Quick Reference)

| Domain | Subagent Type |
|--------|---------------|
| Backend/API | `backend-specialist` |
| Frontend/UI | `frontend-specialist` |
| Database | `database-architect` |
| Testing | `test-engineer` |

> Full matrix: `CLAUDE.md` §6

---

## 5. Mode C: AGENT TEAMS (L6+)

4+ domains, complex dependencies, requires coordination.

### Orchestrator Pattern

```typescript
Task({
  subagent_type: "orchestrator",
  prompt: `Implement: $ARGUMENTS

  1. Load PLAN from docs/PLAN-*.md
  2. TeamCreate({ team_name: "implement-{slug}" })
  3. Spawn specialists per domain:
     - frontend-specialist, backend-specialist, database-architect, test-engineer
  4. TaskCreate() for each atomic task
  5. Execute parallel groups with Promise.all()
  6. Run quality gates after each phase
  7. SendMessage({ type: "shutdown_request" }) to all teammates
  8. TeamDelete() when complete`
})
```

### Team Operations

```typescript
// Create team
TeamCreate({ team_name: "implement-feature", description: "..." })

// Create tasks
TaskCreate({ subject: "Backend API", owner: "backend-specialist" })
TaskCreate({ subject: "Frontend UI", owner: "frontend-specialist", addBlockedBy: ["1"] })

// Assign & execute
TaskUpdate({ taskId: "1", owner: "backend-specialist" })

// Cleanup
SendMessage({ type: "shutdown_request", recipient: "backend-specialist", content: "Done" })
TeamDelete()
```

---

## 6. Quality Gates

```bash
# After each task/phase
bun run check       # TypeScript
bun run lint:check  # Biome (format) + OXLint (lint)
bun test            # Vitest

# Combined
bun run check && bun run lint:check && bun test
```

---

## 7. Failure Handling

1. **Pause** — Don't retry immediately
2. **Identify** — Which task failed?
3. **Debug** — Run `/debug` workflow
4. **Fix** — Minimal, targeted fix
5. **Verify** — Re-run gates before continuing

If subagent fails 3×: Break into smaller tasks OR switch mode OR escalate.

---

## 8. Cleanup (Agent Teams)

```typescript
// Graceful shutdown
SendMessage({ type: "shutdown_request", recipient: "frontend-specialist", content: "Complete" })
SendMessage({ type: "shutdown_request", recipient: "backend-specialist", content: "Complete" })
// ... for all teammates

// After confirmations
TeamDelete()
```

---

## 9. Completion Options

After all tasks pass gates, present:

```
Implementation complete. What would you like to do?

1. **Merge back to <base-branch> locally**
2. **Push and create a Pull Request**
3. **Keep the branch as-is**
4. **Discard this work**

Which option?
```

| Option | Actions |
|--------|---------|
| 1. Merge | `git checkout base && git pull && git merge branch && bun test && git branch -d branch` |
| 2. PR | `git push -u origin branch && gh pr create` |
| 3. Keep | Report branch name |
| 4. Discard | Require "discard" confirmation → `git branch -D branch` |

---

## References

- **CLAUDE.md** — Orchestration, agent types, skill routing, parallel patterns
- **planning** (Phase 3: IMPLEMENT) — Execution modes, batch protocol
- **debugger** — Failure handling + Iron Law verification
