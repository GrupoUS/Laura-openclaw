# Dashboard — Project Rules

> **Parent**: [`AGENTS.md`](../AGENTS.md) · **Scope**: All files inside `dashboard/`

---

## Tech Stack

| Layer     | Technology                                   |
| --------- | -------------------------------------------- |
| Framework | Next.js 14 (App Router, `app/` directory)    |
| Frontend  | React 18 + Tailwind CSS v4                   |
| State     | Zustand (immer middleware)                    |
| Real-time | SSE + Redis Pub/Sub (Upstash + ioredis)      |
| Auth      | iron-session (cookie-based, `IRON_SESSION_PASSWORD` ≥ 32 chars) |
| UI Kit    | shadcn/ui (Radix primitives) + Lucide icons  |
| Charts    | Recharts                                     |
| DnD       | dnd-kit (Kanban board)                       |
| Database  | Neon PostgreSQL + Drizzle ORM                |
| Tests     | Vitest                                       |
| Deploy    | Railway (Dockerfile, standalone output)      |

---

## Package Manager

> [!CAUTION]
> Este projeto usa **`npm`**. Nunca use `bun`, `yarn`, `pnpm`.

| Task         | Command              |
| ------------ | -------------------- |
| Install      | `npm install`        |
| Dev server   | `npm run dev`        |
| Build        | `npm run build`      |
| Tests        | `npm test`           |
| DB push      | `npm run db:push`    |
| DB generate  | `npm run db:generate`|

---

## Architecture

```text
dashboard/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Route group — board, agents, analytics, list
│   ├── api/                # API Route handlers (REST + SSE)
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout (metadata, fonts, providers)
│   └── globals.css         # Tailwind v4 base styles
├── components/             # React components (domain-organized)
│   ├── ui/                 # shadcn/ui primitives ONLY
│   ├── board/              # Kanban (KanbanBoard, Column, TaskCard)
│   ├── agents/             # Agent monitoring (AgentCard, ActivityFeed)
│   ├── analytics/          # Charts (KPIs, donut, timeline, velocity)
│   ├── create/             # Task creation (CreateTaskSheet)
│   ├── list/               # Table views (PhaseGroup, TaskRow)
│   ├── shared/             # Cross-feature (badges, status indicators)
│   └── layout/             # Sidebar, ViewHeader
├── hooks/                  # Custom hooks (Zustand stores, SSE)
├── lib/                    # Core utilities
│   ├── db/                 # Drizzle schema + queries + migrations
│   ├── events/             # EventBus (Redis Pub/Sub)
│   └── notifications/      # Telegram + webhook notification system
├── types/                  # Shared TypeScript type definitions
└── tests/                  # Vitest test suites
```

---

## Mandatory Rules

### Server vs Client Components

- **Server Components** are the default in Next.js App Router
- Add `'use client'` only when the component uses: hooks, event handlers, browser APIs
- Keep `'use client'` boundary as **low as possible** in the component tree
- Never use `'use client'` in `layout.tsx` (root layouts must be Server Components)

### iron-session

- Session config lives in `lib/session.ts`
- `IRON_SESSION_PASSWORD` must be ≥ 32 characters
- Always validate session before accessing protected data
- Never expose session internals to client

### Real-time (SSE + Redis)

- EventBus uses lazy initialization (singleton pattern)
- SSE endpoints stream `data: JSON\n\n` format
- Client hooks (`useTaskEvents`) handle reconnection automatically
- Always close Redis connections on process exit

### Drizzle ORM

- Schema defined in `lib/db/schema.ts`
- Queries in `lib/db/queries.ts` — never write raw SQL in routes
- Always guard `.returning()` results against empty arrays
- FK columns must have corresponding indexes

### Deploy (Railway)

- Build uses `next build` with `output: 'standalone'`
- Dockerfile copies `.next/standalone` + `.next/static` + `public/`
- Always test builds locally before pushing: `npm run build`

---

## Environment Variables

| Variable                 | Required | Purpose                        |
| ------------------------ | -------- | ------------------------------ |
| `DATABASE_URL`           | ✅       | Neon PostgreSQL (also reads `NEON_DATABASE_URL`) |
| `IRON_SESSION_PASSWORD`  | ✅       | Session encryption (≥ 32 chars)|
| `UPSTASH_REDIS_URL`      | ✅       | Redis Pub/Sub for SSE          |
| `UPSTASH_REDIS_TOKEN`    | ✅       | Redis auth                     |
| `GATEWAY_WS_URL`         | ○        | OpenClaw gateway WebSocket     |
| `GATEWAY_TOKEN`          | ○        | Gateway auth                   |
| `TELEGRAM_BOT_TOKEN`     | ○        | Notification bot               |
| `TELEGRAM_CHAT_ID`       | ○        | Notification target            |

> [!WARNING]
> Never hardcode secrets. Use `.env.local` (gitignored).
