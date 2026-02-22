# OpenClaw Admin — Project Rules

> **Parent**: [`AGENTS.md`](../AGENTS.md) · **Scope**: All files inside `dashboard/`

---

## Tech Stack

| Layer    | Technology                       |
| -------- | -------------------------------- |
| Runtime  | Bun (manager + runtime + bundler)|
| Frontend | React 19 + Vite 7               |
| Routing  | TanStack Router (file-based)     |
| State    | TanStack Query + tRPC React Query|
| Backend  | Hono (BFF) + tRPC 11             |
| Database | Neon PostgreSQL + Drizzle ORM    |
| Linter   | OXLint (Rust-native)             |
| Tests    | Vitest                           |
| Schema   | Zod v4 (input validation)        |
| Deploy   | Railway (Dockerfile)             |

---

## Package Manager

> [!CAUTION]
> Este projeto usa **`bun`**. Nunca use `npm`, `yarn`, `pnpm`.

| Task         | Command                |
| ------------ | ---------------------- |
| Install      | `bun install`          |
| Dev server   | `bun dev`              |
| Type check   | `bun run type-check`   |
| Lint check   | `bun run lint:check`   |
| Lint fix     | `bun run lint:fix`     |
| Tests        | `bun run test`         |
| DB push      | `bun run db:push`      |
| DB generate  | `bun run db:generate`  |

---

## Architecture

```text
dashboard/
├── src/
│   ├── client/              # React 19 frontend (SPA)
│   │   ├── routes/          # TanStack Router file-based routes
│   │   ├── components/      # UI components
│   │   ├── main.tsx         # Client entry point
│   │   ├── auth.tsx         # Auth provider + gateway token
│   │   └── trpc.ts          # tRPC React Query client
│   └── server/              # Hono BFF backend
│       ├── index.ts         # Server entry (Hono app + routes)
│       ├── trpc.ts          # tRPC router definition + context
│       ├── trpc-init.ts     # tRPC initialization (initTRPC)
│       ├── db/              # Drizzle schema + connection
│       ├── routers/         # Domain-specific tRPC routers
│       ├── services/        # Business logic layer
│       └── ws/              # WebSocket client to OpenClaw gateway
├── migrations/              # Drizzle Kit SQL migration files
├── drizzle.config.ts        # Drizzle Kit configuration
├── index.html               # Vite HTML entry
├── vite.config.ts           # Vite + TanStack Router plugin
└── .oxlintrc.json           # OXLint rules configuration
```

## Request Lifecycle

```
Browser → Vite SPA → tRPC React Query → HTTP → Hono BFF → tRPC Router
  → Zod Input Validation → Service Logic → Drizzle Query → JSON Response
```

---

## Quality Gates

Before marking a task as complete:

1. `bun run type-check` — no TypeScript errors
2. `bun run lint:check` — OXLint passes
3. `bun run test` — all Vitest tests pass
4. No browser console errors in changed flows

---

## Environment Variables

| Variable                  | Required | Purpose                        |
| ------------------------- | -------- | ------------------------------ |
| `DATABASE_URL`            | ✅       | Neon PostgreSQL connection     |
| `GATEWAY_TOKEN`           | ✅       | Gateway auth token             |
| `GATEWAY_WS_URL`          | ✅       | Gateway WebSocket URL          |

> [!WARNING]
> Never hardcode secrets. Use `.env` (gitignored).
