---
title: Implement
description: Unified implementation workflow with intelligent execution mode selection based on complexity. Loads plan, routes skills, executes with quality gates.
---

# /implement — Implementation Orchestration

$ARGUMENTS

> **Auto-selects execution mode based on task complexity:**
> - **L1-L2**: Direct execution (single task, 1-2 files)
> - **L3-L5**: Structured parallel execution (multi-domain, 3-8 files)
> - **L6+**: Full phased pipeline with deep research

---

## 0. Mandatory First Steps

1. **Read root `AGENTS.md`** — Always, before any action
2. **Load relevant skills** — `view_file` on each applicable `SKILL.md`
3. **Read subdirectory `AGENTS.md`** — Only for directories you will edit

---

## 1. Prerequisites Check

### 1.1 Detect Plan Source

**CRITICAL:** Determine the plan source in this order:

1. **Artifact plan exists:**
   - Check `implementation_plan.md` in the current conversation's brain artifacts
   - If found, load and execute from file

2. **File-based plan exists:**
   - Check `docs/PLAN-*.md` or `./PLAN-*.md` in project root
   - If found, load and execute from file

3. **Chat-based plan (no file):**
   - Use the plan discussed in the current chat session
   - Extract tasks from chat context directly

4. **Fallback:**
   - Recommend `/plan` first
   - Or create tasks from scratch based on user requirements

### 1.2 Analyze Plan Structure

After loading the plan, analyze:

- **Total tasks count**
- **Domains involved** (backend, frontend, database, etc.)
- **Parallel markers** (`[PARALLEL]`, `[PARALLEL-SAFE]`)
- **Dependencies** (`blockedBy`, `(SEQUENTIAL)`)

### 1.3 Select Execution Mode

| Indicators | Mode | Action |
|------------|------|--------|
| 1 domain, <3 tasks | **DIRECT** | Execute tasks sequentially |
| 2-3 domains, parallel possible | **STRUCTURED** | Group by domain, execute parallel groups |
| 4+ domains, complex deps | **PHASED** | Foundation → Core → Integration pipeline |

---

## 2. Mode A: Direct Execution (L1-L2)

### When to Use

- Single domain (only backend OR only frontend)
- 1-3 atomic tasks
- Changes in 1-2 files

### Execution Flow

1. Load the relevant skill for the domain
2. Execute each task sequentially
3. Run quality gates after each task
4. Present results

---

## 3. Mode B: Structured Execution (L3-L5)

### When to Use

- 2-3 different domains (backend + frontend)
- Tasks have `[PARALLEL]` markers
- No complex cross-dependencies

### Execution Flow

1. **Group tasks by domain**
2. **Load skills for each domain** (parallel `view_file` calls)
3. **Execute independent tasks in parallel** (parallel tool calls)
4. **Execute dependent tasks sequentially**
5. **Run quality gates after each group**

### Domain → Skill Routing

| Task Domain | Skill to Load | Path |
|-------------|---------------|------|
| Backend / API / tRPC | `backend-design` | `~/.gemini/antigravity/skills/backend-design/SKILL.md` |
| Database / Auth / Drizzle | `clerk-neon-auth` | `~/.gemini/antigravity/skills/clerk-neon-auth/SKILL.md` |
| Frontend / UI / Components | `frontend-rules` | `~/.gemini/antigravity/skills/frontend-rules/SKILL.md` |
| Security / OWASP | `security-audit` | `~/.gemini/antigravity/skills/security-audit/SKILL.md` |
| Performance / CWV | `performance-optimization` | `~/.gemini/antigravity/skills/performance-optimization/SKILL.md` |
| Mobile / React Native | `mobile-development` | `~/.gemini/antigravity/skills/mobile-development/SKILL.md` |
| SEO | `seo-optimization` | `~/.gemini/antigravity/skills/seo-optimization/SKILL.md` |
| Docker / Deploy | `docker-deploy` | `~/.gemini/antigravity/skills/docker-deploy/SKILL.md` |
| Testing | `webapp-testing` | `~/.gemini/antigravity/skills/webapp-testing/SKILL.md` |
| AI / Gemini | `google-ai-sdk` | `~/.gemini/antigravity/skills/google-ai-sdk/SKILL.md` |

---

## 4. Mode C: Phased Pipeline (L6+)

### When to Use

- 4+ different domains
- Complex dependencies between tasks
- Multiple phases (Foundation → Core → Integration)
- Requires careful coordination

### Execution Flow

```
Phase 1: Foundation (SEQUENTIAL — blocks everything)
  └─► Schema, core models, base config
  └─► Quality gates ✓

Phase 2: Core Features [PARALLEL where safe]
  ├─► Backend endpoints (parallel)
  ├─► Frontend components (parallel)
  └─► Unit tests (parallel)
  └─► Quality gates ✓

Phase 3: Integration (SEQUENTIAL)
  └─► Connect frontend ↔ backend
  └─► Integration tests
  └─► Quality gates ✓
```

---

## 5. Task Metadata Symbols

| Symbol | Meaning | Execution |
|--------|---------|-----------|
| `(SEQUENTIAL)` | Blocks dependent tasks | One by one |
| `[PARALLEL]` | Independent tasks | Simultaneous tool calls |
| `[PARALLEL-SAFE]` | No dependencies at all | Simultaneous tool calls |

---

## 6. Atomic Task Format

Each task should follow this structure:

```markdown
### Task X.Y: [Title]

**Domain:** backend-design
**Dependencies:** Task X.Y-1 (blocking) or [PARALLEL]

**FILE:** `apps/api/src/routers/example.ts:10-25`

**Changes:**
- What to add/modify/delete

**VERIFY:**
bun run check && bun run lint:check
```

---

## 7. Quality Gates

### After Each Atomic Task

```bash
bun run check       # TypeScript compilation
bun run lint:check  # Biome linting
```

### After Each Phase

```bash
bun run check && bun run lint:check && bun test
```

### Gate Failure Protocol

1. **Stop** — Do not proceed to next task
2. **Analyze** — Read the error output carefully
3. **Fix** — Apply minimal targeted fix
4. **Re-verify** — Run gates again
5. **Continue** — Only after gates pass

---

## 8. Failure Handling

1. **Pause immediately** on any failure
2. **Identify failing task** and exact error
3. **Run /debug workflow** if root cause unclear
4. **Apply minimal fix** — one change at a time
5. **Re-run quality gates**
6. **Continue or rollback**

### Escalation

If 3+ fix attempts fail on the same task:
- **Stop** — Do not try more fixes
- **Inform user** via `notify_user` with findings
- Consider breaking the task into smaller pieces
- Consider running `/debug` workflow

---

## 9. Execution Summary

After completion, present:

```
✅ Implementation Complete

📊 Execution Summary:
- Mode: [DIRECT | STRUCTURED | PHASED]
- Total tasks: X
- Sequential phases: Y
- Parallel groups: Z

Validation:
- bun run check: ✅
- bun run lint:check: ✅
- bun test: ✅

Files modified:
- file1.ts
- file2.ts

Next:
1. Review changes
2. Commit and push
3. Run deployment if needed
```

---

## 10. Red Flags — STOP

- Never start on `main`/`master` without explicit consent
- Never skip quality gates
- Never merge without review
- Stop if failures exceed 3 attempts
- Stop if tests fail and cannot be fixed
- Never make multiple unrelated changes at once

---

## 11. References

- **AGENTS.md** — Project rules and standards
- **Skills** — `~/.gemini/antigravity/skills/*/SKILL.md`
- **Planning** — `/plan` workflow (`~/.gemini/antigravity/workflows/plan.md`)
- **Debugging** — `/debug` workflow (`~/.gemini/antigravity/workflows/debug.md`)
