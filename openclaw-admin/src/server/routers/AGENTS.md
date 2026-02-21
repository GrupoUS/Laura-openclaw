# routers/ — tRPC Router Rules

> **Parent**: [`server/AGENTS.md`](../AGENTS.md) · **Scope**: `src/server/routers/`

---

## Current Routers

| File            | tRPC Namespace   | Purpose                    |
| --------------- | ---------------- | -------------------------- |
| `evolution.ts`  | `evolution.*`    | Evolution/training CRUD    |

---

## Router Conventions

### Creating a New Router

```typescript
import { z } from "zod";
import { publicProcedure, router } from "../trpc-init";

export const myRouter = router({
  list: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      // Delegate to service layer
      return ctx.myService.list(input);
    }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      return ctx.myService.create(input);
    }),
});
```

### Rules

1. **Thin routers** — only validate input and delegate to services
2. **Zod v4** — every procedure must have `.input()` with a Zod schema
3. **Error handling** — throw `TRPCError` with correct codes:
   - `NOT_FOUND` — resource doesn't exist
   - `BAD_REQUEST` — invalid input beyond Zod validation
   - `INTERNAL_SERVER_ERROR` — unexpected failures
   - `UNAUTHORIZED` — missing/invalid auth
4. **Naming** — procedures use `camelCase`: `list`, `getById`, `create`, `update`, `delete`
5. **Registration** — add new router to `trpc.ts` main router composition
6. **No DB imports** — never import `db` directly; use service layer or context
7. **Response shape** — return data directly, tRPC handles serialization
