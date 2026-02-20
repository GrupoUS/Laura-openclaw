# neonctl CLI Operations

> Manage Neon PostgreSQL via CLI. Never hardcode connection strings.

## Installation & Auth

```bash
# Install
brew install neonctl

# Authenticate (browser-based)
neonctl auth

# Verify
neonctl me
neonctl --version
```

## Project Context

```bash
# Set context (avoids --project-id on every command)
neonctl set-context --project-id <project-id>

# List projects
neonctl projects list -o json
```

## Connection Strings

```bash
# Default branch
neonctl connection-string

# Specific branch
neonctl connection-string <branch-name>

# Pooled (for serverless drivers)
neonctl connection-string --pooled

# Use inline
DATABASE_URL=$(neonctl connection-string) bun run db:push
psql $(neonctl connection-string)
```

## Branch Management

```bash
# Create feature branch
neonctl branches create --name feat-new-table

# List branches
neonctl branches list -o json

# Delete branch
neonctl branches delete <branch-id>
```

## Schema Diff

Compare schema between branch and parent:

```bash
neonctl branches schema-diff <branch-id>
neonctl branches schema-diff <branch-id> --database neondb
```

## Feature Branch Workflow

```bash
# 1. Create branch
neonctl branches create --name feat-new-table

# 2. Get connection string
export DATABASE_URL=$(neonctl connection-string feat-new-table)

# 3. Push schema changes
bun run db:push

# 4. Verify diff against parent
neonctl branches schema-diff <branch-id>

# 5. If approved, apply to main via Drizzle migration
# 6. Delete feature branch
neonctl branches delete <branch-id>
```

## Output Formats

| Flag | Format | Use Case |
|------|--------|----------|
| `-o table` | Human-readable (default) | Interactive |
| `-o json` | JSON | Scripting |
| `-o yaml` | YAML | Config files |

## Neon Docs as Markdown

```bash
curl https://neon.com/docs/guides/drizzle.md
curl https://neon.com/docs/reference/neon-cli.md
# Full index
curl https://neon.com/docs/llms.txt
```

## Anti-Patterns

- ❌ Hardcoding connection strings instead of `neonctl connection-string`
- ❌ Running without `set-context` (repeating `--project-id` everywhere)
- ❌ Destructive branch ops without `schema-diff` first
- ❌ Guessing doc URLs instead of checking `llms.txt`
