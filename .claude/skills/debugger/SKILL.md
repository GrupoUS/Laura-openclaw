---
name: debugger
description: Use when debugging failures across frontend, backend, auth, database, or full regression audits. Triggers on crash, exception, flaky tests, hydration mismatch, tRPC errors, role/tenant drift, webhook failures, and post-change verification.
---

# Debugger

Single canonical debugging skill for NeonDash.

This skill now includes the practical content of:

- webapp-testing (empty, no migration needed)
- frontend-rules
- backend-design
- clerk-neon-auth
- super-audit

## Iron Law

1. No fix without root cause.
2. No "fixed" claim without fresh evidence.
3. No scope expansion during incident handling.

## When to Use

- runtime errors, failed tests, unstable UI behavior
- API/procedure failures, auth or permission mismatches
- tenant isolation or schema consistency doubts
- broad post-change audit or release hardening checks

Use `performance-optimization` for speed/security/SEO optimization campaigns.

## Packs

| Pack               | Scope                                               | First Action                                             |
| ------------------ | --------------------------------------------------- | -------------------------------------------------------- |
| `frontend-debug`   | React/UI regressions, hydration, interaction issues | capture browser evidence and run focused frontend checks |
| `backend-debug`    | Hono/tRPC/service failures                          | verify procedure boundary, context, and service contract |
| `auth-db-debug`    | Clerk/Neon role, tenant, sync drift                 | validate effective permissions and tenant filters        |
| `systematic-audit` | full cross-layer stability sweep                    | inventory first, then severity-based fixes               |

## 4-Phase Workflow

### 1) Investigate

- define expected vs actual behavior
- reproduce consistently
- read full error output and stack traces

### 2) Pattern Match

- compare with known working patterns in the repo
- identify boundary where behavior diverges

### 3) Hypothesis

- test one hypothesis at a time
- generate alternatives before committing to a fix

### 4) Implement and Verify

- apply minimal targeted change
- run validation gates
- confirm symptom is actually resolved

## Verification Gate

Before claiming success:

1. run the proving command
2. read full output and exit code
3. confirm original failure is gone
4. confirm no new failures introduced

Required gates:

```bash
bun run check && bun run lint:check && bun run test
```

Use `bun run build` for release-facing changes.

## Escalation Rule

- If 1-2 fix attempts fail, restart from investigation.
- If 3 attempts fail, stop and challenge architecture assumptions.


## Common Root Causes Catalog

Quick lookup for frequently encountered issues. See `references/consolidated-domain-rules.md` for full patterns.

| Symptom | Root Cause | Section |
|---------|------------|---------|
| `Select is changing from uncontrolled to controlled` | `value={undefined}` transitioning to string | React Select controlled/uncontrolled |
| `No transactions support in neon-http driver` | HTTP driver doesn't support `db.transaction()` | Neon driver transaction support |
| `Cannot read properties of undefined` after insert | `.returning()[0]` on empty array | Drizzle returning() array access guard |
| HTTP 500 on mutation with transaction | Same as above - wrong driver | Neon driver transaction support |
| Incorrect ROAS/revenue in aggregated metrics | Using `conversions` (count) instead of `conversionValue` (money) | Metrics aggregation type confusion |
| Wrong cost per conversion in combined metrics | Dividing one platform's ratio by combined totals instead of recalculating from raw values | Metrics formula error |


## Consolidated References

- `references/methodology.md` - full debugging method and debiasing
- `references/verification.md` - defense-in-depth and regression prevention
- `references/patterns.md` - async testing and security basics
- `references/consolidated-domain-rules.md` - merged frontend/backend/auth/audit playbook
