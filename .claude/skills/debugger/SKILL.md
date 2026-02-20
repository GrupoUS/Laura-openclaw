---
name: debugger
description: Use when encountering bugs, test failures, unexpected behavior, error messages in console/logs, flaky tests, CI/CD failures, container crashes, slow queries, or when multiple fix attempts have failed. Triggers on error, crash, exception, fail, broken, timeout, flaky.
---

# Debug Skill

> Root cause first. Always. No fixes without investigation.

---

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
NO FIX CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim the fix works.

### The Verification Gate (5 Steps)

BEFORE claiming any fix is complete:

1. **IDENTIFY**: What command proves this fix works?
2. **RUN**: Execute the FULL command (fresh, complete)
3. **READ**: Full output, check exit code, count failures
4. **VERIFY**: Does output confirm the fix?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. **ONLY THEN**: Claim the fix works

### Common Verification Failures

| Claim | Requires | NOT Sufficient |
|-------|----------|----------------|
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| TypeScript clean | `bun run check`: exit 0 | Linter passing |

---

## Quick Symptom → Action

| Symptom | First Action |
|---------|--------------|
| TypeScript error | `bun run check` |
| Test failure | `bun test` — read stack trace completely |
| CI/CD failure | `gh run view --log-failed` |
| Container crash | `docker logs <cid> --tail 50` |
| SSH timeout | See `docker-deploy` skill |
| Flaky test | Check for race conditions, shared state |
| "Works locally" | Compare env vars, DB state, dependencies |

---

## The 4 Phases

Complete each phase before proceeding.

| Phase | Activity | Done When |
|-------|----------|-----------|
| **1. Investigate** | Read errors, reproduce, trace data flow | Understand WHAT and WHY |
| **2. Pattern** | Find working examples, compare differences | Know what's different |
| **3. Hypothesis** | Form single theory, test minimally | Confirmed or new theory |
| **4. Implement** | Create failing test, fix, verify gates | Bug resolved |

**→ Full process:** [`methodology.md`](references/methodology.md)

---

## Phase 1: Self-Interrogation

Write answers to these 3 questions:

```
1. What SHOULD happen? (expected behavior, exact values)
2. What ACTUALLY happens? (observed behavior, exact values)
3. WHERE do they diverge? (specific point)
```

### Multi-Component Tracing

For each boundary (client → tRPC → Drizzle → Neon):

```typescript
console.error("=== Layer ===", { input, output, context });
```

---

## Phase 3.5: Debiasing Checklist

Before committing to a fix:

- [ ] Generated ≥ 2 alternative hypotheses
- [ ] Read COMPLETE error output (not just first line)
- [ ] Fix addresses ROOT CAUSE, not symptom
- [ ] Treated own code with same scrutiny as unfamiliar code

### Rationalization Prevention Table

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Just this once" | No exceptions |
| "Tests passed before" | Fresh run required |
| "Quick fix" | Quick fixes need verification too |
| "I'm tired" | Exhaustion ≠ excuse |

**→ Full debiasing protocol:** [`methodology.md#cognitive-biases-to-avoid`](references/methodology.md)

---

## Phase 4: Verification

```bash
bun run check && bun run lint:check && bun test
```

### 3-Fix Escalation Rule

- **< 3 fixes failed** → Return to Phase 1
- **≥ 3 fixes failed** → **STOP.** Question architecture. Discuss with user.

### Defense-in-Depth

After fixing, add validation at EVERY layer:
1. Entry Point (Zod)
2. Business Logic
3. Environment Guards
4. Debug Instrumentation

**→ Full verification protocol:** [`verification.md`](references/verification.md)

---

## Decision Tree: Which Tool?

```
Problem Type?
├── Backend Error
│   ├── Type error → bun run check
│   ├── Logic error → bun test
│   └── API error → Check tRPC logs
├── Database Error
│   ├── Slow query → neonctl + EXPLAIN
│   └── Schema issue → drizzle-kit push
├── Frontend Error
│   └── Console error → browser DevTools
└── Deploy / CI/CD Error
    ├── GitHub Actions → gh run view --log-failed
    └── Container → docker logs + health probes
```

---

## Red Flags — STOP and Return to Phase 1

| If you catch yourself thinking... | Action |
|-----------------------------------|--------|
| "Quick fix for now" | STOP → Phase 1 |
| "Just try X and see" | STOP → Phase 1 |
| "One more fix attempt" | STOP → Phase 1 |
| "Skip the test" | STOP → Phase 1 |

---

## CLI Quick Reference

```bash
# Backend
bun run check              # Lint & type check
bun test                   # Run tests
bun test path/to/file.test.ts  # Specific file

# Git forensics
git diff HEAD~5            # Recent changes
git bisect start           # Binary search for regression

# CI/CD
gh run list -L 5           # List recent runs
gh run view <ID> --log-failed  # Failed step logs

# VPS
ssh root@31.97.170.4 "docker compose logs app --tail 50"
```

---

## Cross-References

| Domain | Skill | When |
|--------|-------|------|
| Docker/Deploy/CI | `docker-deploy` | Container crashes, deploy failures |
| Auth/Database | `clerk-neon-auth` | Clerk sync, Drizzle, Neon connection |
| Backend | `backend-design` | tRPC errors, middleware |

---

## References (Load as Needed)

| File | Purpose | When to Load |
|------|---------|--------------|
| [`methodology.md`](references/methodology.md) | 4-phase process, 5 Whys, tracing, debiasing | Starting investigation, stuck after 2 failed hypotheses |
| [`verification.md`](references/verification.md) | Defense-in-depth, regression prevention, postmortem | After fix, L5+ bugs, adding validation layers |
| [`patterns.md`](references/patterns.md) | Async testing, test pyramid, security checklist | Writing tests, security review, flaky tests |
