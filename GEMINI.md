---
trigger: always_on
---

# GEMINI.md — Gemini Antigravity Orchestrator (OpenClaw)

> **Role**: Intelligent coordinator for skills, workflows, and commands
> **Project Rules**: [`AGENTS.md`](AGENTS.md)

---

## 1. Quick Reference

| Layer    | Technology                                 |
| -------- | ------------------------------------------ |
| Runtime  | Bun (package manager + runtime + bundler)  |
| Frontend | React 19 + Vite 7                          |
| Backend  | Hono (BFF) + tRPC 11 + Drizzle ORM        |
| Database | Neon PostgreSQL                            |
| Platform | OpenClaw (multi-agent AI gateway)          |
| Linter   | OXLint (Rust-native)                       |

---

## 2. Commands

| Task                 | Command                |
| -------------------- | ---------------------- |
| Install dependencies | `bun install`          |
| Start development    | `bun dev`              |
| Type check           | `bun run type-check`   |
| Lint check (oxlint)  | `bun run lint:check`   |
| Lint fix (oxlint)    | `bun run lint:fix`     |
| Run tests            | `bun run test`         |
| Push DB schema       | `bun run db:push`      |

> **Package Manager**: This project uses **Bun only**. Never use npm, yarn, or pnpm.

---

## 3. Context Loading Protocol

Load rules files in this order (lazy loading for context efficiency):

1. **Root AGENTS.md** — Always load first. Contains project-wide rules.
2. **Subdirectory AGENTS.md** — Load only when editing files in that directory:
   - `openclaw-admin/src/server/AGENTS.md` — Backend (Hono, tRPC, Drizzle)
   - `openclaw-admin/src/client/AGENTS.md` — Frontend (React, TanStack Router)
   - `workspace/AGENTS.md` — Agent workspace definitions
   - `agents/*/AGENTS.md` — Per-agent rules (if present)

### Authority Precedence

When rules conflict:

1. Subdirectory `AGENTS.md` — Domain-specific rules
2. Root `AGENTS.md` — Project-wide rules
3. This file — Gemini Antigravity specific guidance

---

## 4. Workflow Commands

### /plan — Planning Workflow

**Trigger:** Creating implementation plans, new features, architecture design
**Flow:** `Research (parallel) → Consolidate → Present`

### /implement — Implementation Workflow

**Trigger:** Executing plans, building features
**Flow:** `Analyze → Select mode → Execute → Validate`

### /debug — Debugging Workflow

**Trigger:** Bugs, errors, crashes, test failures
**Phases:** `Collect errors → Root cause → Hypothesis test → Fix → Verify`

---

## 5. Skills System

| Domain | Skill Dir | When to Invoke |
|--------|-----------|----------------|
| Architecture | `architecture` | System design, agent coordination |
| API Patterns | `api-patterns` | Backend endpoints, tRPC procedures |
| Database | `database-design` | Schema, migrations, Drizzle |
| Frontend | `frontend-design` | UI components, React patterns |
| React Patterns | `react-patterns` | Hooks, state, rendering |
| Tailwind | `tailwind-patterns` | CSS utilities, responsive |
| TypeScript | `typescript-expert` | Type safety, generics |
| Planning | `planning` | Implementation planning |
| Debugging | `systematic-debugging` | Root cause analysis |
| Testing | `testing-patterns` | Vitest, test design |
| Performance | `performance-profiling` | Profiling, optimization |
| Docker | `docker-expert` | Containers, Railway deploy |
| Server | `server-management` | VPS, infrastructure |
| Security | `vulnerability-scanner` | Security audit |
| SEO | `seo-fundamentals` | Search visibility |
| AI/Data | `ai-data-analyst` | Data analysis, AI features |
| Browser | `agent-browser` | Browser automation |
| UI/UX | `ui-ux-pro-max` | Design systems |
| Canvas | `canvas-design` | Design artifacts |
| App Builder | `app-builder` | Full-stack scaffolding |
| Notion | `notion` | Notion API integration |
| Voice | `voice-calling` | Voice call features |
| Zoom | `zoom` | Zoom integration |
| UDS | `uds-search` | RAG search, embeddings |
| GPUS Theme | `gpus-theme` | Brand theme tokens |
| Python | `python-patterns` | Python scripts |
| Parallel | `parallel-agents` | Multi-agent orchestration |

> **Important**: If there is even a 1% chance a skill applies, invoke it BEFORE taking action.

### Mandatory Skill Loading

Before implementation:

1. Identify request domain(s)
2. Load relevant `SKILL.md` via `view_file` from `skills/<name>/SKILL.md`
3. Execute through the canonical workflow
4. Validate against repository quality gates (`AGENTS.md` §7)

---

## 6. MCP & CLI Tools

| Tool | Purpose |
|------|---------|
| Context7 | Official library docs |
| Tavily | Web search and URL extraction |
| Sequential Thinking | Complex logical problems |

---

## 7. Terminal Command Execution Protocol

Prevent commands from hanging. These rules apply to ALL `run_command` and `command_status` calls.

### WaitMsBeforeAsync Strategy

| Command Type | WaitMs | Examples                                            |
| ------------ | ------ | --------------------------------------------------- |
| Quick ops    | 5000   | git add/rm/status, echo, cat, ls, mkdir, cp         |
| Medium ops   | 8000   | git commit -m, git push, bun install                |
| Build/check  | 1000   | bun run type-check, bun run lint:check              |
| Dev servers  | 3000   | bun dev                                             |
| Chained cmds | 8000   | cmd1 && cmd2 && cmd3                                |

### command_status Monitoring (CRITICAL)

When a command returns a `CommandId`:

1. First check: `WaitDurationSeconds=5`, `OutputCharacterCount=3000`
2. If still running: `WaitDurationSeconds=10`
3. If still running after 20s total: likely stuck → recover
4. **NEVER** use `WaitDurationSeconds > 30` for quick/medium commands
5. Reserve `WaitDurationSeconds=60` ONLY for builds

### Non-Interactive Commands (Mandatory)

- `git commit` → ALWAYS `-m "message"` (never open editor)
- `git log` → ALWAYS `-n N` limit
- `git diff` → use `--stat` or pipe `| head -n 50`
- Prefix `GIT_TERMINAL_PROMPT=0` when git auth might prompt

### Stuck Command Recovery

If command runs > 3× expected duration:

1. `command_status` with `WaitDurationSeconds=0` → read output
2. If prompt `$` visible in output → command is done, proceed
3. If waiting for input → `send_command_input(Terminate=true)`
4. Re-run with corrected non-interactive flags

---

## 8. Quality Gates

### After Each Task

```bash
bun run type-check   # TypeScript verification
bun run lint:check   # OXLint (fast, Rust-native linter)
bun test             # Tests
```

### Red Flags — STOP

- Proposing fixes before root cause found
- Multiple changes at once
- "Just try this and see"
- Skipping reproduction steps

---

## 9. Scope Guardrails

- Keep this file orchestration-only and concise.
- Keep deep technical policy in `AGENTS.md`.
- Keep skill-specific rules inside each `SKILL.md`.
- Do not duplicate policy across agent config files.
