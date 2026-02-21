# hooks/ — Custom React Hooks Rules

> **Parent**: [`dashboard/AGENTS.md`](../AGENTS.md) · **Scope**: `hooks/` directory

---

## Current Hooks

| Hook              | Purpose                                    | Pattern      |
| ----------------- | ------------------------------------------ | ------------ |
| `useTaskStore`    | Global task state (CRUD, filters, phases)  | Zustand + immer |
| `useTaskEvents`   | SSE subscription for real-time updates     | EventSource  |

---

## Zustand Store Rules (`useTaskStore`)

1. **Immer middleware** — mutate state directly inside `set()` callbacks
2. **No async in store** — API calls happen in components, store only holds state
3. **Selectors** — always use granular selectors to prevent unnecessary re-renders:
   ```typescript
   // ✅ Granular — only re-renders when tasks change
   const tasks = useTaskStore((s) => s.tasks);
   
   // ❌ Broad — re-renders on ANY state change
   const store = useTaskStore();
   ```
4. **Actions as methods** — group related mutations together
5. **Never export the raw store** — always export the hook

## SSE Hook Rules (`useTaskEvents`)

1. **Auto-reconnection** — handle `EventSource.onerror` with exponential backoff
2. **Auth via query param** — pass session token in URL since `EventSource` can't set headers
3. **Cleanup** — always close `EventSource` in the `useEffect` cleanup function
4. **Event parsing** — parse `event.data` as JSON with try-catch (messages may be malformed)
5. **Integration** — SSE events should update Zustand store directly

## Creating New Hooks

- File naming: `use<Name>.ts` (camelCase, always start with `use`)
- One hook per file — colocate related types in the same file
- Always specify dependency arrays correctly — no missing deps
- Document the hook's purpose with a JSDoc comment
- If a hook grows beyond 80 lines, consider splitting into smaller hooks
