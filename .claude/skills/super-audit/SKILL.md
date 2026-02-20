---
name: super-audit
description: Use when implementing a large feature and wanting to verify nothing broke — buttons not working, broken imports, orphaned files, missing FK indexes, unguarded mutations, dead links, auth bypass, exposed test endpoints, missing error boundaries, console.log in production, N+1 queries, schema mismatches. Run BEFORE performance-optimization. Triggers on: super-audit, stability audit, full audit, regression check, feature complete, nothing broke, post-feature verification.
---

# Super-Audit Skill

Comprehensive post-feature stability check across the entire NeonDash stack.

## Overview

After implementing a large feature, run this 5-phase audit to catch regressions, orphans, and integrity failures **before they reach production**. Always run `performance-optimization` skill after completing this audit.

## When to Use

- After merging a large feature branch
- Before a production deploy
- After fixing multiple bugs across the stack
- When "nothing should be broken but let's verify"
- When the stability score matters

## When NOT to Use

- Single-file bug fix → use `debugger` skill
- Performance profiling only → use `performance-optimization` skill directly
- Security-only review → use `security-audit` skill

---

## Execution: 5 Phases

### Phase 1 — TypeScript + Build Integrity

```bash
bun run check          # Biome lint (NOT TypeScript types)
bun run lint:check     # Biome format check
```

> [!IMPORTANT]
> `bun run check` does NOT catch TypeScript type errors. Always run LSP diagnostics on recently changed files. Check IDE Problems panel too.

**Checklist:**
- [ ] 0 Biome lint errors
- [ ] 0 Biome format errors
- [ ] 0 LSP/TypeScript errors in modified files
- [ ] Build succeeds: `bun run build`

---

### Phase 2 — Backend Integrity

Load `references/audit-checklists.md` → **Backend** section.
Load `references/grep-patterns.md` → **Backend** patterns.

Run these grep scans:

```bash
# Missing imports — functions used but not defined/imported
bun run check 2>&1 | grep "Cannot find name\|is not defined"

# Test endpoints exposed in production
grep -rn "api/test" apps/api/src/_core/index.ts | grep -v "NODE_ENV"

# Localhost fallbacks in env/config
grep -rn "localhost" apps/api/src/_core/env.ts apps/api/src/billing-router.ts

# console.log in production backend
grep -rn "console\.\(log\|debug\|info\)" apps/api/src --include="*.ts" | grep -v "console\.error\|console\.warn"
```

**Checklist:**
- [ ] No missing import errors flagged by TypeScript/LSP
- [ ] All process crash handlers call `process.exit(1)` (not just log)
- [ ] Test endpoints guarded by `NODE_ENV !== "production"`
- [ ] No `localhost` fallbacks in APP_URL, OAuth URIs (for production paths)
- [ ] Auth on all procedures: public → health only; protected → Clerk; admin → role check
- [ ] Webhook handlers have signature verification (HMAC)
- [ ] No CORS wildcard with credentials

---

### Phase 3 — Database Integrity

Load `references/audit-checklists.md` → **Database** section.

```bash
# Check schema can be applied
bun run db:push

# Find FK columns without indexes (schema inspection)
grep -n "references\|\.references\(" apps/api/drizzle/schema*.ts | head -50
```

**FK Index Rule (NON-NEGOTIABLE):** Every FK column in every table MUST have a corresponding index. Pattern: `fkNameIdx: index("table_column_idx").on(table.columnName)`

**Checklist:**
- [ ] Every FK column has a named index in the same table definition
- [ ] `relations.ts` imports only from schemas where tables actually exist
- [ ] `bun run db:push` succeeds with no errors
- [ ] `roleEnum` and other enums match all values written in code

---

### Phase 4 — Frontend Integrity

Load `references/audit-checklists.md` → **Frontend** section.
Load `references/grep-patterns.md` → **Frontend** patterns.

```bash
# Unguarded mutateAsync (missing try/catch)
grep -rln "mutateAsync(" apps/web/src --include="*.tsx" | xargs grep -L "catch\|onError" 2>/dev/null

# console.log in frontend production code
grep -rn "console\.log\|console\.debug" apps/web/src --include="*.tsx" --include="*.ts"

# Error boundary presence
grep -rn "ErrorBoundary\|error-boundary" apps/web/src --include="*.tsx" | head -5

# Dead anchor ids (check footer + landing page)
grep -n "href=\"#" apps/web/src --include="*.tsx" -r
```

**Checklist:**
- [ ] All `mutateAsync` calls wrapped in try/catch or use `onError` from `useMutation`
- [ ] Global `<ErrorBoundary>` exists in app root
- [ ] GlobalTrpcErrorLink exists in tRPC client
- [ ] All `#anchor` links in footer/nav have matching `id=` in DOM
- [ ] No `console.log` in production frontend code
- [ ] All form submit buttons have a disabled/loading state during mutation

---

### Phase 5 — Quality Report

Compile findings into a structured report:

```markdown
## Super-Audit Report — [Date]

### Score: X/10

| Category         | Score | Issues |
|------------------|-------|--------|
| Build Integrity  | /10   | N      |
| Backend          | /10   | N      |
| Database         | /10   | N      |
| Frontend         | /10   | N      |

### P0 — Critical (Fix Before Merge)
- [ ] [Issue + file + line]

### P1 — High (Fix This Sprint)
- [ ] [Issue + file + line]

### Definition of Done
- [ ] `bun run check` — 0 errors
- [ ] `bun run lint:check` — passes
- [ ] `bun run build` — succeeds
- [ ] `bun run db:push` — succeeds
- [ ] 0 P0 issues
- [ ] Browser QA: all touched pages open, all buttons respond
```

---

## Severity Tiers

| Tier | Description | Examples |
|------|-------------|---------|
| **P0** | Crashes, data loss, security breach | Missing import, auth bypass, plaintext tokens |
| **P1** | UX broken, data corruption risk | Unguarded `mutateAsync`, missing FK index |
| **P2** | Degrades over time | N+1 queries, unbounded lists, console.log |
| **P3** | Technical debt | `as any`, architecture inconsistencies |

---

## After Super-Audit

Once all P0s are resolved, run the `performance-optimization` skill to address P2/performance issues systematically.

---

## References

- `references/audit-checklists.md` — Full per-category checklists
- `references/grep-patterns.md` — Ready-to-run grep commands for each anti-pattern
