# OpenClaw — Agent Rules & Project Specification

> **Single source of truth for ALL AI agent behavior AND project-level technical context.**

---

## AGENTS.md Loading Protocol (Context-Efficient)

1. At task start, read this root `AGENTS.md`.
2. Discover all `AGENTS.md` files once (for awareness/precedence), without fully loading each.
3. Load subdirectory `AGENTS.md` files **only when editing or validating files in that subdirectory**.
4. If work expands to another directory, load that directory's nearest `AGENTS.md` before making changes.

Priority:

- Subdirectory `AGENTS.md` > root `AGENTS.md` > `GEMINI.md`.

---

## Cardinal Rules (Universal — Non-Negotiable)

> [!CAUTION]
> These rules apply to **every** interaction, regardless of domain, skill, or workflow.

1. **Never Assume Correctness.** Do not trust any assertion, model name, API identifier, or pattern. Always verify against official documentation, API responses, or runtime tests **before** applying changes.
2. **Always Debug After Changes.** Every modification — no matter how trivial — must be followed by a verification step (type-check, lint, runtime probe). Never mark a task as done without evidence.
3. **Never Expose Secrets.** API keys, tokens, passwords in `openclaw.json`, `credentials/`, `.env` files must NEVER appear in outputs, commits, or logs.

---

## Project Snapshot

| Field         | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| **Type**      | Multi-Agent AI Platform (WhatsApp, Slack, Voice)                     |
| **Platform**  | OpenClaw (self-hosted gateway + agent orchestration)                 |
| **Admin**     | `openclaw-admin/` — React 19 + Vite 7 + tRPC 11 + Hono + Drizzle   |
| **Dashboard** | `dashboard/` — Next.js 14 + React 18 + Zustand + iron-session       |
| **Runtime**   | **Bun** (openclaw-admin) · **npm** (dashboard/Next.js)               |
| **Routing**   | TanStack Router (admin) · Next.js App Router (dashboard)             |
| **Database**  | Neon PostgreSQL + Drizzle ORM                                        |
| **Linter**    | OXLint (openclaw-admin) · ESLint (dashboard)                         |
| **Tests**     | Vitest                                                               |
| **Purpose**   | AI-powered multi-agent system for customer service + SDR + support   |

---

## Architecture Map

```text
.openclaw/
├── agents/                  # Agent configurations
│   ├── main/                # Laura (Coordinator) — primary agent
│   ├── sdr/                 # SDR agent (sales)
│   ├── suporte/             # Internal support agent
│   ├── cs/                  # Customer Success agent
│   ├── coder/               # Coding assistant agent
│   └── assistant/           # General assistant
├── workspace/               # Shared workspace (AGENTS.md, TOOLS.md, etc.)
├── dashboard/               # Task Dashboard (Next.js 14 + React 18)
│   ├── app/                 # Next.js App Router
│   │   ├── (dashboard)/     # Route group (board, agents, analytics)
│   │   ├── api/             # API routes (tasks, agents, events, auth, health)
│   │   ├── login/           # Login page
│   │   └── layout.tsx       # Root layout
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui primitives (Radix)
│   │   ├── board/           # Kanban board (dnd-kit)
│   │   ├── agents/          # Agent cards + activity feed
│   │   ├── analytics/       # Charts (Recharts)
│   │   ├── create/          # Task creation sheet
│   │   ├── list/            # Table/list views
│   │   ├── shared/          # Cross-feature components
│   │   └── layout/          # Sidebar, headers
│   ├── hooks/               # Zustand store + SSE hooks
│   ├── lib/                 # DB, events, notifications, session, utils
│   │   ├── db/              # Drizzle schema + queries + migrations
│   │   ├── events/          # Redis Pub/Sub EventBus
│   │   └── notifications/   # Telegram + webhook alerts
│   ├── types/               # Shared TypeScript types
│   └── tests/               # Vitest test suites
├── openclaw-admin/          # Admin Panel (React 19 + Vite 7 + Hono BFF)
│   ├── src/
│   │   ├── client/          # React frontend
│   │   │   ├── routes/      # TanStack Router pages
│   │   │   ├── components/  # UI components
│   │   │   ├── main.tsx     # Client entry
│   │   │   └── trpc.ts      # tRPC client
│   │   └── server/          # Hono BFF backend
│   │       ├── index.ts     # Server entry
│   │       ├── trpc.ts      # tRPC router / context
│   │       ├── db/          # Drizzle schema + connection
│   │       ├── routers/     # Domain tRPC routers
│   │       ├── services/    # Business logic (embedding, evolution, memory)
│   │       └── ws/          # WebSocket to gateway
│   ├── migrations/          # Drizzle SQL migrations
│   └── drizzle.config.ts    # Drizzle Kit config
├── skills/                  # 41 OpenClaw skills (installed)
├── scripts/                 # Automation scripts (JS, Python, Shell)
├── config/                  # Platform config files
├── credentials/             # Auth credentials (GITIGNORED)
├── universal-data-system/   # UDS (RAG search, embeddings)
└── openclaw.json            # Master config (gateway, channels, agents, models)
```

---

## Tech Stack Quick Reference

### dashboard (Task Dashboard)

| Layer      | Technology                                          |
| ---------- | --------------------------------------------------- |
| Runtime    | Node.js 22 · **npm** (package manager)              |
| Framework  | Next.js 14 (App Router)                             |
| Frontend   | React 18 + Tailwind CSS v4                          |
| State      | Zustand (immer middleware)                           |
| Real-time  | SSE + Redis Pub/Sub (Upstash)                        |
| Auth       | iron-session (cookie-based)                          |
| UI Kit     | shadcn/ui (Radix primitives) + Lucide icons          |
| Charts     | Recharts                                             |
| DnD        | dnd-kit                                              |
| Database   | Neon PostgreSQL + Drizzle ORM                        |
| Tests      | Vitest                                               |
| Deploy     | Railway (Dockerfile)                                 |

### openclaw-admin (Admin Panel)

| Layer    | Technology                       |
| -------- | -------------------------------- |
| Runtime  | Bun                              |
| Frontend | React 19 + Vite 7                |
| Routing  | TanStack Router (file-based)     |
| State    | TanStack Query + tRPC            |
| Backend  | Hono (BFF) + tRPC 11             |
| Database | Neon PostgreSQL + Drizzle ORM    |
| Linter   | OXLint (Rust-native)             |
| Tests    | Vitest                           |

### OpenClaw Platform

| Layer      | Technology                      |
| ---------- | ------------------------------- |
| Gateway    | OpenClaw (port 3333, local)     |
| Channels   | WhatsApp (Baileys) + Slack      |
| AI Models  | Gemini 3 Flash/Pro, Claude Opus |
| Skills     | 41 installed skills             |
| Scripts    | Node.js + Python automation     |
| Data/RAG   | Universal Data System (UDS)     |

---

## Commands

### dashboard

| Task                 | Command                |
| -------------------- | ---------------------- |
| Install dependencies | `npm install`          |
| Start development    | `npm run dev`          |
| Build production     | `npm run build`        |
| Run tests            | `npm test`             |
| Push DB schema       | `npm run db:push`      |
| Generate migrations  | `npm run db:generate`  |

### openclaw-admin

| Task                 | Command                |
| -------------------- | ---------------------- |
| Install dependencies | `bun install`          |
| Start development    | `bun dev`              |
| Type check           | `bun run type-check`   |
| Lint check           | `bun run lint:check`   |
| Lint fix             | `bun run lint:fix`     |
| Push DB schema       | `bun run db:push`      |
| Generate migrations  | `bun run db:generate`  |
| Run tests            | `bun run test`         |

---

## Package Manager

> [!CAUTION]
> **openclaw-admin/** usa **`bun`** como package manager, runtime e bundler.
> ✅ `bun install`, `bun run`, `bunx`, `bun test`
> ❌ Nunca use `npm`, `yarn`, `pnpm` no openclaw-admin

> [!CAUTION]
> **dashboard/** usa **`npm`** como package manager (Next.js standard).
> ✅ `npm install`, `npm run`, `npx`, `npm test`
> ❌ Nunca use `bun`, `yarn`, `pnpm` no dashboard

---

## Environment Variables

| Variable                  | Required | Purpose                        |
| ------------------------- | -------- | ------------------------------ |
| `DATABASE_URL`            | ✅       | Neon PostgreSQL connection     |
| `OPENCLAW_GATEWAY_TOKEN`  | ✅       | Gateway auth token             |
| `OPENCLAW_GATEWAY_URL`    | ✅       | Gateway WebSocket URL          |
| `NODE_ENV`                | ○        | Runtime environment            |

> [!WARNING]
> **Never hardcode secrets.** Use `.env` files (gitignored) for all sensitive values.
> `openclaw.json` contains sensitive keys — it is gitignored and must NEVER be committed.

---

## 1. System Role & Operational Directives

**ROLE:** Senior Full-Stack Architect & AI Platform Engineer.
**EXPERIENCE:** 15+ years. Master of multi-agent systems, real-time WebSocket, and UX engineering.

- **Follow Instructions:** Execute the request immediately. Do not deviate.
- **Zero Fluff:** No unsolicited advice in standard mode.
- **Stay Focused:** Concise answers only. No wandering.
- **Output First:** Prioritize code and working solutions.

---

## 2. The "ULTRATHINK" Protocol

**TRIGGER:** When the user prompts **"ULTRATHINK"**, when planning, or when executing workflow commands (`/plan`, `/implement`, `/debug`).

- **Override Brevity:** Suspend the "Zero Fluff" rule.
- **Maximum Depth:** Engage in exhaustive, deep-level reasoning.
- **Multi-Dimensional Analysis:**
  - _Psychological:_ User sentiment and cognitive load.
  - _Technical:_ Performance, state complexity, WebSocket reliability.
  - _Agent Architecture:_ Multi-agent coordination, session isolation.
  - _Scalability:_ Long-term maintenance, horizontal scaling.
- **Prohibition:** **NEVER** use surface-level logic. If the reasoning feels easy, dig deeper.

---

## 3. Core Principles

```yaml
mantra: "Think → Research → Plan → Decompose → Implement → Validate"
KISS: "Simple systems that work over complex systems that don't"
YAGNI: "Build only what requirements specify. Remove dead code immediately"
Chain_of_Thought: "Break problems into sequential steps. Show reasoning"
preserve_context: "Maintain complete context across all transitions"
incorporate_always: "Enhance existing structure, avoid creating new files unnecessarily"
always_audit: "Never assume the error is fixed, always validate"
```

---

## 4. LEVER Philosophy

> **L**everage patterns | **E**xtend first | **V**erify reactivity | **E**liminate duplication | **R**educe complexity

**"The best code is no code. The second best structure is the one that already exists."**

### Decision Tree

```
Before coding:
├── Can existing code handle it? → Yes: EXTEND
├── Can we modify existing patterns? → Yes: ADAPT
└── Is new code reusable? → Yes: ABSTRACT → No: RECONSIDER
```

---

## 5. Three-Pass Implementation

| Pass              | Focus                                | Code           |
| ----------------- | ------------------------------------ | -------------- |
| 1. Discovery      | Find related code, document patterns | None           |
| 2. Design         | Write interfaces, plan data flow     | Minimal        |
| 3. Implementation | Execute with max reuse               | Essential only |

---

## 6. Code Quality Standards

### Type Safety

- Use `unknown` over `any` when type is genuinely unknown
- Use const assertions (`as const`) for immutable values
- Leverage TypeScript's type narrowing over assertions
- Use meaningful variable names instead of magic numbers

### Modern TypeScript

```typescript
const foo = bar?.baz ?? "default"; // Optional chaining + nullish
for (const item of items) {}       // for...of
const { id, name } = user;        // Destructuring
const msg = `Hello ${name}`;      // Template literals
```

### "Type instantiation is excessively deep"

```typescript
const mutate = useMutation((api as any).leads.updateStatus);
```

### React Rules

**Both projects:**
- Function components only (no classes)
- Hooks at top level only (never conditional)
- Always specify hook dependency arrays correctly
- Use unique IDs for `key` props (not array indices)

**React 19 (openclaw-admin only):**
- Use `ref` as prop (not `React.forwardRef`)
- Use `use()` hook for promises and context

**React 18 (dashboard only):**
- Use `React.forwardRef` for ref forwarding
- Mark client components with `'use client'` directive
- Server Components are the default in Next.js App Router
- Keep `'use client'` boundary as low as possible in the component tree

### Error Handling

- No `console.log`/`debugger` in production
- Throw `Error` objects with descriptive messages
- Use early returns over nested conditionals
- Handle async errors with try-catch

### Security

- Add `rel="noopener"` on `target="_blank"` links
- Avoid `dangerouslySetInnerHTML`
- Never use `eval()`
- Never commit API keys, tokens, secrets, or credentials
- Handle PII carefully
- `openclaw.json` is **NEVER** committed — contains all secrets

---

## 7. Quality Gates (Definition of Done)

Before marking a task as complete:

**openclaw-admin:**
- `bun run type-check` — no TS errors
- `bun run lint:check` — OXLint passes
- `bun test` — all tests pass

**dashboard:**
- `npm run build` — no build errors
- `npm test` — all tests pass

**Both:**
- No browser console errors in changed flows
- No hardcoded secrets in committed files
- All FK columns have corresponding indexes (Drizzle schema)

---

## 8. Commit Format

Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.

---

## 9. Debugging Protocol

**When an error occurs:**

1. **PAUSE** — Don't immediately retry
2. **TRIAGE** — Classify severity (L1-L10) and blast radius
3. **THINK** — Root Cause Analysis:
   - What exactly happened?
   - Why? (5 Whys)
   - What are 3 possible fixes?
   - **Self-interrogate:** Am I anchoring on the first thing I saw?
4. **HYPOTHESIZE** — Formulate hypothesis + validation plan
5. **EXECUTE** — Apply fix after understanding cause
6. **SELF-REVIEW** — Before declaring fixed:
   - Does the fix address root cause, not symptom?
   - Any regression risk?
   - Would a colleague approve this approach?

### Cognitive Debiasing

| Bias              | Countermeasure                                  |
| ----------------- | ----------------------------------------------- |
| Confirmation bias | Actively seek evidence AGAINST your hypothesis  |
| Anchoring         | Consider 3+ hypotheses before investigating     |
| Fixation          | If stuck > 10 min, change approach entirely     |
| Ownership bias    | Treat your code with same skepticism as others' |

---

## 10. Backend Architecture (openclaw-admin)

### Canonical Request Lifecycle

```
HTTP → Hono BFF → tRPC Router → Procedure
  → Zod Input Validation → Service Logic → Drizzle Query → Response
```

### Key Rules

- Always import `db` singleton from `src/server/db/`
- Zod validation on every mutation/query input
- `TRPCError` with proper codes, not generic `Error`
- `Promise.all` for batch operations
- No `SELECT *` — always specify columns

### WebSocket Gateway Communication

- `src/server/ws/` handles real-time connection to OpenClaw gateway
- Gateway runs on port 3333 (configurable via `openclaw.json`)
- Auth via gateway password token

---

## 11. Stability Audit Rules (Mandatory)

> These rules are NON-NEGOTIABLE and must be applied to ALL code changes.

### A. Import and Export Completeness

Every module that exports types or functions MUST re-export through barrel files (`index.ts`). Missing exports cause runtime crashes.

### B. Type Safety (Non-Null Assertions)

Never use `!` (non-null assertion) on optional data.

```typescript
// ❌ WRONG
const id = input.id!;

// ✅ CORRECT
const id = input.id ?? null;
```

### C. Array Access Guards

Always guard against empty arrays when accessing `.returning()` or `.select()` results.

```typescript
// ✅ CORRECT
const [inserted] = await db.insert(table).values(data).returning();
if (!inserted)
  throw new TRPCError({ code: "NOT_FOUND", message: "Falha ao inserir" });
```

### D. Environment Configuration

Never default production-required variables to localhost.

```typescript
// ✅ CORRECT
const APP_URL = process.env.APP_URL;
if (!APP_URL && process.env.NODE_ENV === "production") {
  throw new Error("APP_URL is required in production");
}
```

### E. Console Statement Removal

Never leave `console.log` in production code. Use structured logging.

### F. Error Boundary Security

Error boundaries must never expose stack traces in production.

```typescript
// ✅ CORRECT
catch (error) {
  return (
    <div>
      <p>Algo deu errado. Tente novamente.</p>
      {process.env.NODE_ENV === "development" && <pre>{error.stack}</pre>}
    </div>
  );
}
```

---

## 12. OpenClaw Platform Rules

### Agent Configuration

- Agent definitions live in `agents/<id>/` with `AGENT.md` and `workspace/`
- Master config in `openclaw.json` defines agent list, models, channels, bindings
- **Never manually edit `openclaw.json`** without understanding the full schema
- Use `openclaw` CLI for configuration changes when possible

### Skills

- 41 skills installed in `skills/`
- Skills extend agent capabilities with tools + scripts
- `openclaw.json` → `skills.entries` configures API keys per skill

### Scripts

- Automation scripts in `scripts/` (JS, Python, Shell)
- Scripts handle: Notion sync, Kiwify enrichment, Asaas billing, RAG search, Zoom, Voice
- Always test scripts in isolation before connecting to cron jobs

### Channels

- **WhatsApp** (Baileys integration) — DM + groups, media up to 50MB
- **Slack** (Socket mode) — DM + groups, reactions, search, slash commands
- Channel config in `openclaw.json` → `channels`

### Gateway

- Local mode on port 3333
- Auth via password (`openclaw.json` → `gateway.auth`)
- Control UI enabled at `localhost:3333`
- DB admin at `openclaw-admin` dashboard

---

## Hybrid Lint Architecture: OXLint

This project uses **OXLint** (Rust-native) for maximum lint performance.

| Tool | Role | Speed | Config |
|------|------|-------|--------|
| **OXLint** | Linter (Rust-native) | ~50ms for typical projects | `.oxlintrc.json` |

### Quick Reference

- **Lint check**: `bun run lint:check`
- **Lint fix**: `bun run lint:fix`

### OXLint Plugins Active

- `typescript` — TS-specific rules
- `react` — React hooks, JSX patterns
- `jsx-a11y` — Accessibility
- `import` — Import validation
- `unicorn` — Modern JS patterns

---

## Authority Precedence

When guidance overlaps:

1. Subdirectory `AGENTS.md` (overrides root for domain-specific rules)
2. Root `AGENTS.md` (this file)
3. `GEMINI.md` (orchestrator-specific)

---

## Using Skills

> [!IMPORTANT]
> If you think there is even a 1% chance a skill might apply to what you are doing,
> you ABSOLUTELY MUST invoke the skill. This is NOT negotiable.

### Skill Priority

1. **Process skills first** (debugging, planning) — these determine HOW to approach the task
2. **Implementation skills second** (frontend, backend, database) — these guide execution

### Red Flags — STOP

| Thought                             | Reality                                            |
| ----------------------------------- | -------------------------------------------------- |
| "This is just a simple question"    | Questions are tasks. Check for skills.             |
| "I need more context first"         | Skill check comes BEFORE clarifying questions.     |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first.       |
| "This doesn't need a formal skill"  | If a skill exists, use it.                         |
| "I remember this skill"             | Skills evolve. Read current version.               |
| "The skill is overkill"             | Simple things become complex. Use it.              |

---

## What Automated Tools Won't Catch

OXLint catches most code quality issues automatically. Focus your attention on:

1. **Business logic correctness** — Linters can't validate your algorithms
2. **Meaningful naming** — Use descriptive names for functions, variables, and types
3. **Architecture decisions** — Component structure, data flow, and API design
4. **Edge cases** — Handle boundary conditions and error states
5. **Multi-agent coordination** — Session isolation, concurrent message handling
6. **Documentation** — Add comments for complex logic, prefer self-documenting code
