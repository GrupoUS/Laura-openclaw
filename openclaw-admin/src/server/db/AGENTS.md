# db/ — Drizzle ORM Rules

> **Parent**: [`server/AGENTS.md`](../AGENTS.md) · **Scope**: `src/server/db/`

---

## Files

| File         | Purpose                                    |
| ------------ | ------------------------------------------ |
| `schema.ts`  | All table definitions (Drizzle `pgTable`)  |
| `client.ts`  | Neon serverless pool + Drizzle client      |
| `migrate.ts` | Migration runner script                    |

---

## Schema Rules (`schema.ts`)

1. **Naming**: tables use `snake_case`, columns use `snake_case`
2. **Always define explicit types** — no implicit type coercion
3. **FK columns must have indexes** — create with `index()` alongside FK
4. **Timestamps**: use `timestamp('created_at').defaultNow()` and `timestamp('updated_at')`
5. **Enums**: use `pgEnum()` — never raw string literals
6. **IDs**: use `serial('id').primaryKey()` or `uuid('id').defaultRandom().primaryKey()`
7. **Soft delete**: prefer `deleted_at` timestamp over hard delete

### Current Tables

- `conversations` — chat session records
- `messages` — individual messages within conversations
- `memory_entries` — agent memory/knowledge storage
- `evolution_entries` — agent evolution/training logs
- `embeddings` — vector embeddings for semantic search

## Client Rules (`client.ts`)

- **Singleton** — export one `db` instance, import everywhere
- Uses `@neondatabase/serverless` with connection pooling
- `DATABASE_URL` must be set — throw on missing

## Migration Workflow

```bash
# Generate migration after schema change
bun run db:generate

# Push schema directly (dev only)
bun run db:push

# Run programmatic migrations
bun run src/server/db/migrate.ts
```

> [!WARNING]
> Always generate a migration for production changes. Never use `db:push` in production.
