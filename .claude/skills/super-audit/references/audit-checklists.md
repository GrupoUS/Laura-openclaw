# Super-Audit Checklists

Detailed checklists for each audit phase. Load only the section relevant to the current phase.

---

## Backend Checklist

### Imports & Runtime Safety

- [ ] All symbols used in code have corresponding import statements
- [ ] `createHash` imported from `node:crypto` wherever hashing is used
- [ ] Process crash handlers in `_core/index.ts`:
  - `uncaughtException` → logs + `process.exit(1)` after flush delay
  - `unhandledRejection` → logs + `process.exit(1)` after flush delay
- [ ] Graceful shutdown handler clears intervals and closes connections

### Test Endpoint Exposure

- [ ] `/api/test/*` routes guarded: `if (process.env.NODE_ENV !== "production")`
- [ ] No hardcoded test tokens or mock data in production paths

### Auth & Authorization

- [ ] `publicProcedure` → health checks ONLY
- [ ] `protectedProcedure` → all user-facing procedures
- [ ] `adminProcedure` → all admin operations
- [ ] Ownership checks on per-user data: `isOwnId || isAdminOrMentor` pattern
- [ ] `getPublicSetting` restricted to explicit allowlist (`PUBLIC_SYSTEM_SETTING_KEYS`)
- [ ] Webhook handlers verify HMAC signatures before processing payload

### Environment & Config Safety

- [ ] `APP_URL` throws error if missing (no `localhost` fallback for billing redirects)
- [ ] No credentials hardcoded in source (use `.env`)

### Request/Response Patterns

- [ ] No `SELECT *` — always specify explicit columns
- [ ] All list queries have `limit` (prefer cursor-based pagination)
- [ ] `emailSent` and equivalent status flags set to `false` in catch blocks

---

## Database Checklist

### FK Index Coverage (NON-NEGOTIABLE)

Every FK column must have a named index. Check all `schema*.ts` files:

```
Pattern: index("table_column_idx").on(table.columnName)
```

> **Tip:** Before adding, always `grep` for the index name — many already exist. Don't double-add.

### Schema Consistency

- [ ] `relations.ts` imports only from schemas where tables are actually defined
- [ ] Root `drizzle.config.ts` paths point to real schema files (or marked deprecated)
- [ ] `roleEnum` and other enums include ALL values written in codebase
- [ ] Zod schemas in webhook handlers match actual DB columns

### Migrations

- [ ] `bun run db:push` succeeds without manual SQL

---

## Frontend Checklist

### Error Handling

- [ ] Global `<ErrorBoundary>` wraps the router/app root
- [ ] `ErrorBoundary` shows stack trace only in dev (`import.meta.env.PROD === false`)
- [ ] Global tRPC error link catches: `UNAUTHORIZED`, `TOO_MANY_REQUESTS`, network errors
- [ ] tRPC error link placed BEFORE `splitLink` in the links chain
- [ ] All `mutateAsync` calls wrapped in try/catch OR use `onError` callback from `useMutation`

### Interactive Elements

- [ ] Every mutation-triggering button has `disabled` during loading (prevents double-submit)
- [ ] Form submit buttons show spinner/loading state
- [ ] Buttons with `onClick` handlers are `<button>` not `<div>` (accessibility)
- [ ] Delete/destructive actions have confirmation dialog

### Navigation & Links

- [ ] All `href="#anchor"` links have matching `id="anchor"` in the DOM
- [ ] `<a target="_blank">` has `rel="noopener noreferrer"`

### Code Quality

- [ ] No `console.log`, `console.debug` in production frontend code
- [ ] No hardcoded hex colors (`bg-[#abc]` → use semantic tokens)
- [ ] No `as any` in new code (use `unknown` + type narrowing)

---

## Security Checklist

### OWASP Top 10 (2025)

| Category | Check |
|----------|-------|
| A01 Broken Access Control | Ownership checks on all user-scoped data |
| A02 Security Misconfiguration | CORS whitelist (not `*`), security headers |
| A04 Cryptographic Failures | OAuth tokens encrypted at rest; no plaintext storage |
| A05 Injection | Zod validation on all webhook inputs |
| A07 Auth Failures | Webhook HMAC verification; rate limiting on auth endpoints |

---

## Code Quality Checklist

- [ ] No `console.log` anywhere in source (use structured logging or remove)
- [ ] `as any` count not increasing sprint-over-sprint
- [ ] All admin check procedures use `adminProcedure` (not manual `if (role === "admin")`)
- [ ] No god components > 600 lines (extract sub-components)
