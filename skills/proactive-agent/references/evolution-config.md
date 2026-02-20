# Evolution Cron Configuration

## OpenClaw Cron Jobs

Add these to your OpenClaw cron configuration in `openclaw.json`:

### Evolution Cycle (Every 3 Hours)
```json
{
  "id": "evolution-cycle",
  "schedule": "0 */3 * * *",
  "text": "Run evolution cycle: curl -X POST http://localhost:3000/api/evolution/trigger -H 'Content-Type: application/json' -d '{\"trigger\": \"cron\"}'"
}
```

### Nightly Consolidation (10:30 PM)
```json
{
  "id": "evolution-nightly",
  "schedule": "30 22 * * *",
  "text": "Review all sessions from the last 24 hours. For each session, extract: 1) Key learnings and patterns, 2) Mistakes or gotchas to avoid, 3) User preferences discovered, 4) Unfinished items. Then call curl -X POST http://localhost:3000/api/evolution/trigger -H 'Content-Type: application/json' -d '{\"trigger\": \"cron\"}' to persist findings."
}
```

### Weekly Prune (Sunday 3 AM)
```json
{
  "id": "evolution-prune",
  "schedule": "0 3 * * 0",
  "text": "Prune low-value memories older than 90 days with score below 20. Use the admin API to consolidate duplicates."
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | Neon PostgreSQL connection string |
| `GOOGLE_API_KEY` | Yes | — | Google AI API key for embeddings |
| `AGENT_NAME` | No | `main` | Agent name for session directory |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/evolution/trigger` | Trigger evolution cycle |
| GET | `/trpc/evolution.stats` | Get evolution statistics |
| GET | `/trpc/evolution.memories.list` | List all memories |
| GET | `/trpc/evolution.memories.search` | Semantic search |
| POST | `/trpc/evolution.memories.store` | Store a memory manually |
| POST | `/trpc/evolution.cycles.trigger` | Trigger via tRPC |

## Pre-Flight Verification

Before running evolution cron jobs, verify NeonDB connectivity:

```bash
# 1. Verify neonctl is installed
neonctl --version

# 2. Test DB connection
psql $(neonctl connection-string) -c "SELECT 1 AS connected;"

# 3. Verify Drizzle schema is synced
DATABASE_URL=$(neonctl connection-string) bun run db:push

# 4. Check evolution tables exist
psql $(neonctl connection-string) -c "\dt"
```

> **Rule:** Never start evolution cron jobs without verifying DB connectivity first.
