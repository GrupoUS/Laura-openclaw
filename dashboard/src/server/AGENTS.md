# server/ — Hono BFF + tRPC Backend Rules

> **Parent**: [`dashboard/AGENTS.md`](../../AGENTS.md) · **Scope**: `src/server/`

---

## Architecture

| File/Dir       | Purpose                                     |
| -------------- | ------------------------------------------- |
| `index.ts`     | Hono app entry, CORS, static files, tRPC mount |
| `trpc.ts`      | tRPC router composition + context factory   |
| `trpc-init.ts` | `initTRPC` singleton (call once only)       |
| `db/`          | Drizzle schema + Neon client                |
| `routers/`     | Domain tRPC routers                         |
| `services/`    | Business logic (embedding, evolution, memory)|
| `ws/`          | WebSocket client to OpenClaw gateway         |

---

## Request Lifecycle

```
HTTP Request → Hono middleware → tRPC adapter → Router → Procedure
  → Zod input validation → Service logic → Drizzle query → Response
```

## Rules

### tRPC Procedures

1. **Input validation** — every procedure must have a Zod schema on `.input()`
2. **Error codes** — throw `TRPCError` with proper `code`, not generic `Error`:
   ```typescript
   throw new TRPCError({ code: "NOT_FOUND", message: "Agent não encontrado" });
   ```
3. **Procedure types**:
   - `publicProcedure` — no auth required (health checks, login)
   - `protectedProcedure` — requires valid gateway token in context

### Hono Middleware

- CORS configured for development origin
- Static file serving for Vite build output
- tRPC adapter mounted at `/trpc`
- Keep middleware lean — no heavy processing

### Context

- Created in `trpc.ts` via `createContext()`
- Inject `db` client and auth info into context
- Never re-instantiate `db` — import singleton from `db/client.ts`

### Separation of Concerns

```
Router → thin orchestration (validate input, call service, return result)
Service → business logic (transformations, multi-step operations)
DB → data access only (queries, inserts, updates)
```

- Routers must NOT contain business logic
- Services must NOT import Hono or tRPC types
- DB layer must NOT throw `TRPCError` (use generic `Error`)
