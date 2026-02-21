# client/ — React 19 Frontend Rules

> **Parent**: [`openclaw-admin/AGENTS.md`](../../AGENTS.md) · **Scope**: `src/client/`

---

## Architecture

| File/Dir         | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `main.tsx`       | React root, TanStack Router, QueryClient    |
| `auth.tsx`       | Auth context provider, gateway token mgmt   |
| `trpc.ts`        | tRPC client + React Query integration       |
| `routes/`        | TanStack Router file-based route pages      |
| `components/`    | UI components                               |
| `index.css`      | Tailwind CSS v4 entry                       |
| `routeTree.gen.ts` | Auto-generated route tree (DO NOT EDIT)   |

---

## Rules

### React 19

- Function components only (no classes)
- Use `ref` as prop — **never** use `React.forwardRef`
- Use `use()` hook for promises and context
- Hooks at top level only (never conditional)
- Always specify dependency arrays

### tRPC React Query

```typescript
// ✅ Query
const { data, isLoading } = trpc.agents.list.useQuery();

// ✅ Mutation
const mutation = trpc.evolution.create.useMutation({
  onSuccess: () => queryClient.invalidateQueries(),
});
```

- Always handle loading and error states
- Use `queryClient.invalidateQueries()` after mutations
- Never call tRPC procedures outside of React components/hooks

### Styling

- Tailwind CSS v4 classes only
- Never use inline `style={}` unless dynamic values require it
- Never hardcode hex colors — use Tailwind tokens

### Auth

- Gateway token stored in `auth.tsx` context
- All routes require authentication — check before rendering
- Token passed to tRPC client via headers

### `routeTree.gen.ts`

> [!CAUTION]
> This file is **auto-generated** by TanStack Router Vite plugin.
> Never edit manually. It regenerates on `bun dev` or `vite build`.
