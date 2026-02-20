# CLI-First Neon Operations Standards (Canonical)

Defines when to use `neonctl` CLI, direct DB (Drizzle), provider APIs, or Neon docs.

Related docs:
- `../SKILL.md`
- `./neonctl-operations.md`
- `./drizzle-neon-patterns.md`
- `./clerk-neon-sync-contract.md`
- `./stripe-webhook-lifecycle.md`

## 1) Decision Table

| Task Type | Preferred Interface | Why |
|---|---|---|
| Clerk user metadata/role ops | Clerk Backend API | authoritative identity API, auditability |
| Stripe customer/subscription ops | Stripe API/webhooks | authoritative billing source |
| Neon schema migration | `bun run db:push` (dev) / Drizzle `generate` (prod) | deterministic, versioned |
| Neon branch management | **`neonctl` CLI** | branches create/delete/schema-diff/restore |
| Neon schema diffing | **`neonctl branches schema-diff`** | compare branches without external deps |
| Connection string retrieval | **`neonctl connection-string`** | secure, uses project context |
| Neon project/DB inspection | **`neonctl` CLI** (`-o json`) | fast introspection, scriptable |
| Neon documentation lookup | **`neon.com/docs/<path>.md`** | fetch any doc page as markdown |
| Bulk local refactors/docs/scripts | CLI | speed and repeatability |
| Application DB queries/mutations | Drizzle ORM (`neon-http`) | type-safe, app-layer queries |

## 2) Direct DB vs API

### Use API first when
- Identity fields (`email`, Clerk lifecycle, auth data).
- Billing lifecycle changes (subscription status, invoices).
- External source-of-truth data must stay canonical.

### Use direct DB writes when
- Internal projections/materializations.
- Derived entitlements or denormalized query fields.
- Event processing checkpoints/idempotency tables.

## 3) Safe Mutation Order

1. Receive authoritative event/intent from source API.
2. Validate signature/auth.
3. Apply transactional changes in Neon (via Drizzle).
4. Update projection metadata back to Clerk (if needed).
5. Record audit + processed event.

## 4) neonctl CLI Standards

- **Always use `neonctl`** for Neon platform operations (branches, projects, databases, roles).
- Use `neonctl set-context --project-id <id>` to avoid passing `--project-id` on every command.
- Use `-o json` for scripted/programmatic output.
- Use `neonctl branches schema-diff` to compare branch schemas before merging.
- Use `neonctl connection-string` to retrieve connection URLs securely.
- Never bypass idempotency checks during event replay tests.

### Common Operations

```bash
# Set project context (avoids --project-id on every command)
neonctl set-context --project-id <project-id>

# List branches
neonctl branches list -o json

# Create feature branch
neonctl branches create --name dev-feature

# Schema diff between branches
neonctl branches schema-diff <branch-id>

# Get connection string
neonctl connection-string [branch] -o json

# List databases
neonctl databases list

# Run SQL (via psql with connection string)
psql $(neonctl connection-string) -c "SELECT version();"
```

## 5) Neon Documentation Access

Any Neon doc page can be fetched as markdown:

```bash
# Append .md to URL
curl https://neon.com/docs/guides/drizzle.md

# Or request markdown content type
curl -H "Accept: text/markdown" https://neon.com/docs/guides/drizzle
```

Full docs index: `https://neon.com/docs/llms.txt`

## 6) Anti-Patterns

- Updating Clerk metadata and DB separately without reconciliation key.
- Using ad-hoc SQL as primary path for recurring business transitions.
- Triggering entitlement updates directly from frontend client state.
- Using external MCP servers when `neonctl` CLI covers the same operations.
- Guessing Neon doc URLs — always check `neon.com/docs/llms.txt` first.

## 7) Validation Checklist

- [ ] Each state mutation path has one authoritative source.
- [ ] DB writes are transactional and auditable.
- [ ] Projection updates are deterministic and retry-safe.
- [ ] `neonctl` is used for all Neon platform operations.
- [ ] No MCP server dependencies for Neon DB management.
