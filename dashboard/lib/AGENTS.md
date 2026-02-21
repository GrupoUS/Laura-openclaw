# lib/ — Core Utilities Rules

> **Parent**: [`dashboard/AGENTS.md`](../AGENTS.md) · **Scope**: `lib/` directory

---

## Module Map

| File/Dir           | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `db/schema.ts`     | Drizzle table definitions (tasks, subtasks, agents, activity) |
| `db/queries.ts`    | All database queries (CRUD, aggregations)      |
| `db/migrations/`   | Drizzle Kit generated SQL migrations           |
| `db.ts`            | Neon serverless pool + Drizzle client singleton |
| `events/emitter.ts`| EventBus (Redis Pub/Sub, lazy-init singleton)  |
| `events/types.ts`  | Event type definitions                         |
| `notifications/`   | Notification system (Telegram, webhook, stuck-cron) |
| `session.ts`       | iron-session configuration + helpers           |
| `api.ts`           | HTTP client utilities for internal API calls   |
| `utils.ts`         | General helpers (`cn()`, etc.)                 |
| `auth.ts`          | Auth helpers                                   |

---

## Drizzle ORM (`db/`)

### Schema (`schema.ts`)

- All tables use `pgTable()` from `drizzle-orm/pg-core`
- Always define explicit column types — no implicit coercion
- FK columns **must** have corresponding indexes
- Use `timestamp('created_at').defaultNow()` for creation timestamps
- Enum values use `pgEnum()` — never raw strings

### Queries (`queries.ts`)

- **No `SELECT *`** — always specify columns explicitly
- Guard `.returning()` results: check for empty array before accessing `[0]`
- Use `Promise.all` for batch operations
- Complex queries: use Drizzle's query builder, not raw SQL
- Always handle errors with try-catch and meaningful error messages

### Database Client (`db.ts`)

- Singleton pattern — import `db` from this file everywhere
- Uses `@neondatabase/serverless` pool
- Never create additional database connections

---

## EventBus (`events/`)

- **Lazy initialization** — EventBus instance created on first access
- Redis Pub/Sub via `ioredis` (subscriber) + `@upstash/redis` (publisher)
- Event types: `task:created`, `task:updated`, `task:deleted`, `subtask:*`
- Always clean up subscriptions on process termination
- Never import EventBus in client-side code

## Notifications (`notifications/`)

- `index.ts` — main notification dispatcher
- `telegram.ts` — Telegram Bot API integration
- `webhook.ts` — generic webhook sender (future: WhatsApp)
- `stuck-cron.ts` — cron job that detects blocked tasks
- Always check for env vars before attempting to send notifications

## Session (`session.ts`)

- iron-session with `IRON_SESSION_PASSWORD` (≥ 32 chars)
- Cookie name: consistent across all routes
- Never store sensitive data in session beyond user ID and role

## Utils (`utils.ts`)

- `cn()` — Tailwind class merger (`clsx` + `tailwind-merge`)
- Keep this file minimal — max 10 utility functions
- If a utility is domain-specific, put it in the relevant module instead
