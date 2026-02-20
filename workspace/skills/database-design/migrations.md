# Migration Principles

> Safe migration strategy for zero-downtime changes.

## Safe Migration Strategy

```
For zero-downtime changes:
│
├── Adding column
│   └── Add as nullable → backfill → add NOT NULL
│
├── Removing column
│   └── Stop using → deploy → remove column
│
├── Adding index
│   └── CREATE INDEX CONCURRENTLY (non-blocking)
│
└── Renaming column
    └── Add new → migrate data → deploy → drop old
```

## Migration Philosophy

- Never make breaking changes in one step
- Test migrations on data copy first
- Have rollback plan
- Run in transaction when possible

## Serverless Databases

### Neon (Serverless PostgreSQL)

| Feature           | Benefit          |
| ----------------- | ---------------- |
| Scale to zero     | Cost savings     |
| Instant branching | Dev/preview      |
| Full PostgreSQL   | Compatibility    |
| Autoscaling       | Traffic handling |
| `neonctl` CLI     | Branch + diff    |

#### Safe Migration with neonctl

```bash
# 1. Create isolated branch
neonctl branches create --name feat-migration

# 2. Point Drizzle at the branch
export DATABASE_URL=$(neonctl connection-string feat-migration)

# 3. Push schema changes to branch
bun run db:push

# 4. Verify diff against parent (main)
neonctl branches schema-diff <branch-id>

# 5. If approved → apply to main, delete branch
neonctl branches delete <branch-id>
```

> See `neonctl.md` for full CLI reference.

### Turso (Edge SQLite)

| Feature             | Benefit           |
| ------------------- | ----------------- |
| Edge locations      | Ultra-low latency |
| SQLite compatible   | Simple            |
| Generous free tier  | Cost              |
| Global distribution | Performance       |
