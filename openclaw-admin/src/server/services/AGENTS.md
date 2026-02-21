# services/ — Business Logic Rules

> **Parent**: [`server/AGENTS.md`](../AGENTS.md) · **Scope**: `src/server/services/`

---

## Current Services

| File            | Purpose                                       |
| --------------- | --------------------------------------------- |
| `evolution.ts`  | Evolution entry CRUD, analysis, search         |
| `embedding.ts`  | Vector embedding generation (Google GenAI)     |
| `memory.ts`     | Agent memory management (store, retrieve, search) |

---

## Rules

### Architecture

1. **Services own business logic** — all transformations, validations, and multi-step operations
2. **Dependency injection** — receive `db` client via constructor or parameter, never import directly
3. **Framework-agnostic** — services must NOT import:
   - tRPC types (`TRPCError`, `router`, `procedure`)
   - Hono types (`Context`, `Handler`)
   - React types
4. **Error handling** — throw plain `Error` with descriptive message; routers translate to `TRPCError`

### Patterns

```typescript
// ✅ Service function
export async function createEvolution(
  db: DrizzleClient,
  input: EvolutionInput,
): Promise<Evolution> {
  const [result] = await db.insert(evolutions).values(input).returning();
  if (!result) throw new Error("Failed to create evolution entry");
  return result;
}
```

### External API Integration

- `embedding.ts` calls Google GenAI for vector generation
- Always wrap external calls in try-catch with timeout
- Cache results when possible to reduce API calls
- API keys come from environment variables — never hardcode

### Testing

- Services should be the primary unit test target
- Mock `db` and external APIs in tests
- Test edge cases: empty results, API failures, invalid input
