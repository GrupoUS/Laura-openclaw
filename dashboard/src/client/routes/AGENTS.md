# routes/ — TanStack Router Rules

> **Parent**: [`client/AGENTS.md`](../AGENTS.md) · **Scope**: `src/client/routes/`

---

## File-Based Routing Conventions

| File              | Route   | Purpose                         |
| ----------------- | ------- | ------------------------------- |
| `__root.tsx`      | `/`     | Root layout (shell, nav, providers) |
| `index.tsx`       | `/`     | Home/dashboard page             |
| `agents.tsx`      | `/agents` | Agent management              |
| `channels.tsx`    | `/channels` | Channel configuration       |
| `config.tsx`      | `/config` | System configuration          |
| `crons.tsx`       | `/crons` | Cron job management            |
| `evolution.tsx`   | `/evolution` | Evolution/training history  |
| `providers.tsx`   | `/providers` | AI provider management      |
| `sessions.tsx`    | `/sessions` | Session management           |
| `tools.tsx`       | `/tools` | Tool configuration            |

---

## Rules

1. **One route per file** — each file exports a single route definition
2. **`__root.tsx`** — the root layout wrapper; handles global nav, error boundaries, auth checks
3. **Route creation**: use `createFileRoute()` from TanStack Router
   ```typescript
   import { createFileRoute } from "@tanstack/react-router";
   
   export const Route = createFileRoute("/agents")({
     component: AgentsPage,
   });
   ```
4. **Data loading** — use route `loader` for data fetching (pre-load before render)
5. **Type safety** — TanStack Router provides full type inference; never use `any` for route params
6. **Navigation** — use `<Link>` component, never `<a>` tags for internal routes
7. **New routes** — just create a new `.tsx` file; `routeTree.gen.ts` updates automatically on save
8. **Keep pages lean** — orchestrate components, don't write complex UI logic in route files
9. **Error handling** — use route `errorComponent` for route-level error boundaries
