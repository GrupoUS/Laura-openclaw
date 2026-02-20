# neonctl CLI Operations Reference

Comprehensive reference for Neon platform operations via the `neonctl` CLI.

Related docs:
- `../SKILL.md`
- `./cli-vs-mcp-standards.md`
- `./drizzle-neon-patterns.md`

## 1) Installation & Authentication

### Install (macOS)

```bash
brew install neonctl
# or
bun install -g neonctl
```

### Authenticate

```bash
# Interactive (opens browser)
neonctl auth

# With API key (non-interactive, CI/CD)
neonctl <command> --api-key <NEON_API_KEY>
```

### Verify

```bash
neonctl me              # Show current user
neonctl --version       # Show CLI version
```

## 2) Project Context

Set project context to avoid repeating `--project-id` on every command:

```bash
# Set context for current directory
neonctl set-context --project-id <project-id>

# List projects
neonctl projects list -o json

# Get project details
neonctl projects get <project-id> -o json
```

## 3) Branch Management

```bash
# List all branches
neonctl branches list -o json

# Create a feature branch (from default parent)
neonctl branches create --name dev-feature

# Create branch from specific parent
neonctl branches create --name dev-feature --parent <parent-branch-id>

# Get branch info
neonctl branches get <branch-id> -o json

# Delete branch
neonctl branches delete <branch-id>

# Rename branch
neonctl branches rename <branch-id> --name new-name

# Restore branch to specific point
neonctl branches restore <branch-id>

# Reset branch to parent
neonctl branches reset <branch-id> --parent
```

## 4) Schema Diff

Compare schema between a branch and its parent:

```bash
# Diff branch against parent
neonctl branches schema-diff <branch-id>

# Diff with specific database
neonctl branches schema-diff <branch-id> --database neondb
```

Use this for:
- Verifying migration effects before merging
- Reviewing schema changes in feature branches
- Auditing drift between environments

## 5) Connection Strings

```bash
# Get connection string for default branch
neonctl connection-string -o json

# Get connection string for specific branch
neonctl connection-string <branch-name-or-id> -o json

# Use inline with psql
psql $(neonctl connection-string)

# Use inline with Drizzle
DATABASE_URL=$(neonctl connection-string) bun run db:push
```

## 6) Database & Role Management

```bash
# List databases
neonctl databases list

# Create database
neonctl databases create --name my_database

# List roles
neonctl roles list

# Create role
neonctl roles create --name my_role
```

## 7) Operations & Monitoring

```bash
# List recent operations
neonctl operations list -o json
```

## 8) Output Formatting

| Flag | Format | Use Case |
|------|--------|----------|
| `-o table` | Human-readable table (default) | Interactive inspection |
| `-o json` | JSON | Scripting, piping, programmatic use |
| `-o yaml` | YAML | Config files, documentation |

## 9) Neon Documentation as Markdown

Any Neon doc page can be fetched as markdown for agent consumption:

```bash
# Append .md to any doc URL
curl https://neon.com/docs/guides/drizzle.md
curl https://neon.com/docs/reference/neon-cli.md
curl https://neon.com/docs/connect/connection-pooling.md

# Alternative: request markdown content type
curl -H "Accept: text/markdown" https://neon.com/docs/guides/drizzle
```

### Common Documentation Paths

| Topic | URL |
|-------|-----|
| Full docs index | `https://neon.com/docs/llms.txt` |
| Drizzle ORM | `https://neon.com/docs/guides/drizzle.md` |
| Connection pooling | `https://neon.com/docs/connect/connection-pooling.md` |
| Branching | `https://neon.com/docs/introduction/branching.md` |
| Serverless driver | `https://neon.com/docs/serverless/serverless-driver.md` |
| CLI reference | `https://neon.com/docs/reference/neon-cli.md` |
| Neon Auth | `https://neon.com/docs/auth/overview.md` |
| API reference | `https://neon.com/docs/reference/api-reference.md` |

### Finding the Right Page

Search the index for the right doc page:

```bash
curl https://neon.com/docs/llms.txt | grep -i "drizzle"
```

> **Rule:** Never guess doc URLs. Always check `neon.com/docs/llms.txt` first.

## 10) CI/CD Integration

For automated pipelines, use `--api-key` with a Neon API key stored as a secret:

```bash
# GitHub Actions example
neonctl branches create --name "preview-$PR_NUMBER" --api-key $NEON_API_KEY
neonctl connection-string "preview-$PR_NUMBER" --api-key $NEON_API_KEY -o json
```

## 11) Common Workflow: Feature Branch

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

## 12) Anti-Patterns

- Running `neonctl` commands without setting project context first.
- Using MCP servers when `neonctl` CLI covers the same operation.
- Hardcoding connection strings instead of using `neonctl connection-string`.
- Running destructive branch operations without schema-diff verification.
- Guessing Neon doc URLs instead of checking `llms.txt` index.
