---
name: backend-design
description: Use when implementing, debugging, or hardening backend features in Bun + Hono + tRPC + Drizzle + Neon + Clerk, including webhook reliability, auth/context consistency, and rollback-safe operations. Use ESPECIALLY when preparing for TurboRepo monorepo migration, restructuring workspaces, extracting shared packages, when tRPC procedures fail, when context/auth is inconsistent, when database queries are slow, when webhooks are lost, when middleware order matters, or when adding new API endpoints.
---

# Backend Design Skill

Provide a single source of truth for backend architecture, operations, and incident response in this stack.

> **Core Principle:** Single source of truth for Bun + Hono + tRPC + Drizzle + Neon + Clerk.

## When to Use

### Trigger Symptoms (Use this skill when...)

- Implementing new backend features or refactoring
- TurboRepo monorepo migration, workspace structure, shared packages
- Auth, context, role, impersonation issues
- Cache inconsistency or stale sessions
- Webhook reliability, retries, dedup, signatures
- Database latency or migration regressions
- External API instability, timeout, rate limit
- tRPC procedure failures or type errors
- Middleware ordering problems
- Session/cache dual-write issues

### When NOT to Use

- Frontend UI work → use `frontend-rules` or `frontend-design@claude-plugins-official` skill
- Docker/deployment → use `docker-deploy` skill
- Bug investigation → use `debugger` skill
- Planning new features → use `planning` skill

---

## Content Map

| Reference                                                      | Purpose                                                           |
| -------------------------------------------------------------- | ----------------------------------------------------------------- |
| [API Patterns](references/api-patterns.md)                     | Procedure hierarchy, boundary contracts, Hono-first API standards |
| [Request Lifecycle Maps](references/request-lifecycle.md)      | Hono request flow                                                 |
| [Database Design](references/database-design.md)               | Schema strategy, Drizzle patterns, Neon operational behavior      |
| [Infrastructure](references/infrastructure.md)                 | Session cache, queueing, scheduler constraints, observability     |
| [Operational Guardrails](references/operational-guardrails.md) | Resilience, security, rollback, SLO-minded controls               |
| [Runbooks](references/runbooks.md)                             | Incident playbooks for critical backend failures                  |
| [Debugging Strategy Matrix](references/debugging-matrix.md)    | Symptom to cause to diagnostics to fix to prevention              |
| [Code Principles](references/code-principles.md)               | LEVER, Three-Pass, Do/Don’t, anti-pattern catalog                 |
| [TypeScript Patterns](references/typescript-patterns.md)       | Type-depth fixes and maintainability patterns                     |
| [Hono Patterns Reference](references/hono-migration.md)        | Hono setup, middleware, webhook, SSE patterns                     |
| [TurboRepo Migration](references/turborepo-migration.md)       | Phase 2 monorepo structure, workspaces, shared packages           |

---

## Canonical Architecture Patterns

Apply this sequence for every backend change:

1. Choose procedure boundary by trust level: `public` → `protected` → `mentorado` → `admin`.
2. Enforce input contract with Zod before business logic.
3. Build context once per request with deterministic auth resolution and request-scoped logger.
4. Route orchestration to service layer for non-trivial logic.
5. Use Drizzle as only SQL access path for application code.
6. Isolate external APIs behind adapters with retries, backoff, and circuit behavior.
7. Emit structured logs and metrics at every trust boundary and failure domain.
8. Validate rollback path before merge for schema and integration changes.

Use detailed maps in [`references/request-lifecycle.md`](references/request-lifecycle.md).

## Framework Selection Strategy

| Scenario                  | Framework                | Rationale                                       |
| ------------------------- | ------------------------ | ----------------------------------------------- |
| New API endpoints         | Hono                     | Lightweight, Web Standards, better performance  |
| New webhooks              | Hono                     | Native Web Request/Response, simpler middleware |
| tRPC integration          | Hono + @hono/trpc-server | Stable endpoint contract with modern runtime    |
| Complex middleware chains | Hono                     | Prefer built-in middleware and explicit order   |

Hono is the default and only runtime target for this project.

## Monorepo Architecture (Phase 2 — Planned)

Target structure when migrating to TurboRepo monorepo:

```
neondash/
├── apps/
│   ├── api/           # Hono + tRPC backend (@repo/api)
│   └── web/           # React + Vite frontend (@repo/web)
├── packages/
│   ├── shared/        # AppRouter type, Zod schemas, utilities (@repo/shared)
│   └── config/        # tsconfig, biome configs (@repo/config)
├── turbo.json
└── package.json       # Root workspace
```

### Import Convention (Post-Migration)

| Current                | Monorepo               |
| ---------------------- | ---------------------- |
| `../shared/types`      | `@repo/shared/types`   |
| `../../drizzle/schema` | `@repo/shared/schema`  |
| Relative path depth    | Flat workspace imports |

### Shared Package Strategy

Extract to `packages/shared`:

- `AppRouter` type export (consumed by frontend tRPC client)
- Zod validation schemas used by both client and server
- Utility functions shared across boundaries
- Constants and enums used in both apps

Keep in `apps/api`:

- All service layer code, routers, middleware
- Database queries, Drizzle schema
- Webhook handlers, auth context

→ Full guide: [references/turborepo-migration.md](references/turborepo-migration.md)

## Workflow Alignment

Align architecture work with planning workflow in [`/.agent/workflows/plan.md`](../../workflows/plan.md):

- Run research cascade before major design choices: local codebase → docs → synthesis.
- Keep tasks atomic with explicit validation and rollback criteria.
- Gate high-risk changes with incident readiness runbook updates.

## Required Operational Standards

Always include these concerns in backend design and review:

- Session cache dual-write correctness and invalidation reliability.
- In-memory webhook queue failure mode containment.
- Scheduler limits, idempotency, and catch-up semantics.
- Tight Clerk auth and context coupling safeguards.
- Schema sprawl control under LEVER extension-first policy.
- External API rate limiting, timeout budgets, and degraded-mode behavior.

Use runbooks in [`references/runbooks.md`](references/runbooks.md) and matrix in [`references/debugging-matrix.md`](references/debugging-matrix.md).

## Backend Do/Don’t Baseline

Do:

- Prefer extension-first schema evolution and explicit indexing.
- Prefer idempotent writes for webhook and scheduler paths.
- Prefer structured logs with request and actor correlation.
- Prefer bounded retries with jitter and failure classification.

Don’t:

- Don’t add new tables for 1:1 extensions without hard justification.
- Don’t couple router handlers to raw external clients.
- Don’t rely on in-memory-only queues for critical delivery guarantees.
- Don’t merge without failure diagnostics and rollback instructions.

Use full catalog in [`references/code-principles.md`](references/code-principles.md).

## PR Readiness and Hardening

Before approving backend changes, validate:

1. Architecture fit and lifecycle integrity.
2. Failure-mode handling for cache, webhook, DB, and external APIs.
3. Observability coverage: logs, metrics, and actionable alerts.
4. Security controls: auth, authorization, input boundaries, secrets handling.
5. Rollback and data safety for migrations and incident response.

Use full checklist in [`references/operational-guardrails.md`](references/operational-guardrails.md).

## Execution Commands

```bash
bun run check
bun run lint:check
bun test server
bun run db:push
```

---

## Rationalization Table

| Excuse                                       | Reality                                                         |
| -------------------------------------------- | --------------------------------------------------------------- |
| "I'll add the index later"                   | Later = never. Queries will be slow from day one.               |
| "This is a simple 1:1, new table is fine"    | Extension-first schema evolution. Every time.                   |
| "I'll skip the rollback plan"                | Migrations fail. Without rollback, you're stuck.                |
| "Cache invalidation is hard, I'll skip it"   | Stale cache = wrong data. Dual-write or bust.                   |
| "Webhooks can retry forever"                 | Infinite retries = infinite latency. Bound retries with jitter. |
| "I'll use any client directly in the router" | Direct coupling = untestable. Adapter pattern always.           |
| "This logic is too simple for service layer" | Simple grows complex. Service layer from day one.               |
| "I'll add observability after it works"      | "After" = never. Logs at every trust boundary.                  |

---

## Red Flags — STOP and Fix

| Red Flag                            | Action                                        |
| ----------------------------------- | --------------------------------------------- |
| New table for 1:1 extension         | Use ALTER TABLE. Score > 5 = extend.          |
| No index on FK column               | Add index. Every FK needs one. No exceptions. |
| Direct client call in router        | Extract to adapter with retry/backoff.        |
| No rollback for migration           | Write down migrations. Test rollback.         |
| In-memory queue for critical path   | Add persistent queue or accept data loss.     |
| Missing request correlation in logs | Add requestId to every log entry.             |
| Cache without invalidation          | Add invalidation path or don't cache.         |
| No timeout on external API          | Add timeout + circuit breaker.                |
