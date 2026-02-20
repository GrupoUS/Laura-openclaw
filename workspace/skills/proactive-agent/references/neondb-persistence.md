# NeonDB Memory Persistence

> Three-tier memory: files → database → semantic search.

## Architecture

```
Tier 1: File Memory (immediate)
├── memory/YYYY-MM-DD.md  → Raw daily capture
├── MEMORY.md             → Curated wisdom
└── Survives session restarts

Tier 2: DB Persistence (durable)
├── NeonDB PostgreSQL     → Structured memory + embeddings
├── pgvector              → Semantic similarity search
└── Survives file loss, searchable at scale

Tier 3: Semantic Search (retrieval)
├── memory_search tool    → Query by meaning
├── Powered by embeddings → Find related context
└── Best for "do I know about X?"
```

## Connection via neonctl

```bash
# Verify CLI is installed
neonctl --version

# Authenticate
neonctl auth

# Set project context
neonctl set-context --project-id <project-id>

# Get connection string for .env
neonctl connection-string --pooled
```

## Environment Setup

```env
# Required in .env for evolution/memory persistence
DATABASE_URL="postgresql://user:pass@ep-host-pooler.region.aws.neon.tech/neondb?sslmode=require"
GOOGLE_API_KEY="your-google-ai-key"  # For embeddings
```

> **Never hardcode connection strings.** Use `neonctl connection-string --pooled` to generate.

## Verification

Before running evolution cycles, verify DB connectivity:

```bash
# Quick connectivity test
psql $(neonctl connection-string) -c "SELECT 1 AS connected;"

# Check evolution tables exist
psql $(neonctl connection-string) -c "\dt"

# Verify from Drizzle
DATABASE_URL=$(neonctl connection-string) bun run db:push
```

## How Evolution Uses NeonDB

1. **Store** — Agent learns something → embedding generated → stored in NeonDB with vector
2. **Search** — Agent needs context → semantic query via pgvector → top-K memories returned
3. **Prune** — Weekly cron → low-score memories older than 90 days removed
4. **Consolidate** — Nightly cron → duplicate/similar memories merged

## Anti-Patterns

- ❌ Using file memory alone for long-term knowledge (doesn't scale)
- ❌ Skipping `neonctl auth` before evolution cron jobs
- ❌ Hardcoding `DATABASE_URL` instead of using `neonctl connection-string`
- ❌ Running evolution without verifying DB connectivity first
