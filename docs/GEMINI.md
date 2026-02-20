---
trigger: always_on
---

# GEMINI.md — Gemini Antigravity Orchestrator

> **Role**: Intelligent coordinator for skills, workflows, and commands
> **Project Rules**: [`AGENTS.md`](AGENTS.md)

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
| Type check           | `bun run type-check` |
| Linter check (oxlint)| `bun run lint:oxlint:check` |
| Format check (biome) | `bunx biome check`   |
| Linter & Format fix  | `bunx biome check --write && bun run lint:oxlint` |
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
   - `scripts/AGENTS.md` — Scripts
   - `scripts/sql/AGENTS.md` — SQL scripts

### Authority Precedence

When rules conflict:

1. `.agent/skills/*/SKILL.md` — Domain authority (non-overridable)
2. Subdirectory `AGENTS.md` — Domain-specific rules
3. Root `AGENTS.md` — Project-wide rules
4. This file — Gemini Antigravity specific guidance

---

## 4. Workflow Commands

### /plan — Planning Workflow

**Trigger:** Creating implementation plans, new features, architecture design
**Flow:** `Research (parallel) → Consolidate (project-planner) → Present`
**Entry:** `.agent/workflows/plan.md`

### /implement — Implementation Workflow

**Trigger:** Executing plans, building features
**Flow:** `Analyze → Select mode → Execute → Validate`
**Entry:** `.agent/workflows/implement.md`

### /debug — Debugging Workflow

**Trigger:** Bugs, errors, crashes, test failures
**Phases:** `Collect errors → Root cause → Hypothesis test → Fix → Verify`
**Entry:** `.agent/workflows/debug.md`

### /design — Design Workflow

**Trigger:** UI components, pages, styling
**Phases:** `Prototype (Stitch) → Convert (React) → Validate`
**Entry:** `.agent/workflows/design.md`

### /frontend-debug — Frontend Debug Workflow

**Trigger:** React flickering, UI broken, console errors, hydration failures, component bugs
**Phases:** `react-doctor (static) → agent-browser (dynamic) → Root cause → Fix → Verify`
**Entry:** `.agent/workflows/frontend-debug.md`

---

## 5. Skills System

| Domain | Skill | When to Invoke |
|--------|-------|----------------|
| Backend/Hono/tRPC | `backend-design` | API patterns, procedures, middleware |
| Database/Drizzle/Neon | `clerk-neon-auth` | Schema, migrations, auth |
| Frontend/React/shadcn | `frontend-rules` | GPUS tokens, components, styling |
| Frontend/UI Design | `frontend-design` | Distinctive interfaces |
| Docker/Deploy | `docker-deploy` | CI/CD, containers, VPS |
| Meta APIs/WhatsApp | `meta-api-integration` | Instagram, Facebook, WhatsApp |
| Baileys/WhatsApp | `baileys-integration` | WhatsApp Web integration |
| Debugging | `debugger` | Root cause analysis |
| Planning | `planning` | D.R.P.I.V methodology |
| Security | `security-audit` | Vulnerabilities, OWASP |
| Performance | `performance-optimization` | Profiling, Core Web Vitals |
| Testing | `webapp-testing` | react-doctor + agent-browser, UI validation |
| SEO | `seo-optimization` | Search visibility |
| Google AI | `google-ai-sdk` | Gemini models, AI SDK |
| Mobile | `mobile-development` | React Native, Flutter |

> **Important**: If there is even a 1% chance a skill applies, invoke it BEFORE taking action.

### Mandatory Skill Loading

Before implementation:

1. Identify request domain(s)
2. Load relevant `SKILL.md` via `view_file`
3. Execute through the canonical workflow command
4. Validate against repository quality gates (`AGENTS.md` §8)

---

## 6. MCP & CLI Tools

| Tool | Purpose |
|------|---------|
| Context7 | Official library docs |
| Tavily | Web search and URL extraction |
| Clerk Snippets | Official Clerk patterns |
| Sequential Thinking | Complex logical problems |
| Stitch | UI design prototyping |

> [!CAUTION]
> **`mcp-server-neon` is DEACTIVATED.** Do NOT call `mcp_mcp-server-neon_*` tools.
> Use `neonctl` CLI for all Neon operations (branches, schema-diff, connections, SQL).

---

## 7. Terminal Command Execution Protocol

Prevent commands from hanging. These rules apply to ALL `run_command` and `command_status` calls.

### WaitMsBeforeAsync Strategy

| Command Type | WaitMs | Examples                                            |
| ------------ | ------ | --------------------------------------------------- |
| Quick ops    | 5000   | git add/rm/status, echo, cat, ls, mkdir, cp         |
| Medium ops   | 8000   | git commit -m, git push, gh secret set, bun install |
| Build/check  | 1000   | bun run check, bun run build, bun run lint:check    |
| Dev servers  | 3000   | bun dev, bunx convex dev                            |
| Chained cmds | 8000   | cmd1 && cmd2 && cmd3                                |

### command_status Monitoring (CRITICAL)

When a command returns a `CommandId`:

1. First check: `WaitDurationSeconds=5`, `OutputCharacterCount=3000`
2. If still running: `WaitDurationSeconds=10`
3. If still running after 20s total: the command is likely stuck → recover
4. **NEVER** use `WaitDurationSeconds > 30` for quick/medium commands
5. Reserve `WaitDurationSeconds=60` ONLY for builds (`bun run build`)

### Non-Interactive Commands (Mandatory)

- `git commit` → ALWAYS `-m "message"` (never open editor)
- `git log` → ALWAYS `-n N` limit
- `git diff` → use `--stat` or pipe `| head -n 50`
- `gh` → use `--yes` where available
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
bun run type-check         # TypeScript verification
bun run lint:oxlint:check  # OXLint (fast, Rust-native linter)
bunx biome check           # Biome (formatter check)
bun test                   # Tests
```

### Red Flags — STOP

- Proposing fixes before root cause found
- Multiple changes at once
- "Just try this and see"
- Skipping reproduction steps

---

## 9. Scope Guardrails

- Keep this file orchestration-only and concise.
- Keep deep technical policy in skill files.
- Keep project rules and standards in `AGENTS.md`.
- Do not duplicate policy across agent config files.
