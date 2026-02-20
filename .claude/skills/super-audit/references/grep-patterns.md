# Super-Audit Grep Patterns

Ready-to-run commands for detecting anti-patterns in NeonDash. Run from project root.

---

## Phase 1 — Build & TypeScript

```bash
bun run check 2>&1 | grep -E "error|Cannot find|is not a"
bun run lint:check 2>&1 | head -50
bun run build 2>&1 | tail -20
```

---

## Phase 2 — Backend Patterns

```bash
# Missing imports
bun run check 2>&1 | grep "Cannot find name"

# Test endpoints not guarded by NODE_ENV
grep -n "api/test" apps/api/src/_core/index.ts

# Localhost fallbacks
grep -rn "localhost" apps/api/src/_core/env.ts apps/api/src/billing-router.ts

# console.log in backend
grep -rn "console\.log\|console\.debug" apps/api/src --include="*.ts" | grep -v "\.test\."

# Webhook handlers without signature verification
grep -rn "webhook" apps/api/src --include="*.ts" -l | xargs grep -L "signature\|hmac\|token\|verify"

# Missing auth on procedures
grep -rn "publicProcedure\." apps/api/src/routers --include="*.ts" | grep -v "health\|ping\|public"

# as any usage count
grep -rn " as any" apps/api/src --include="*.ts" | wc -l
grep -rn " as any" apps/web/src --include="*.tsx" --include="*.ts" | wc -l
```

---

## Phase 3 — Database Patterns

```bash
# FK columns (to find which need indexes)
grep -n "\.references(" apps/api/drizzle/schema*.ts | awk -F: '{print $1, $2, $3}' | head -40

# Existing indexes
grep -n "index(" apps/api/drizzle/schema.ts | head -40

# relations.ts import sources
grep -n "^import" apps/api/drizzle/relations.ts

# roleEnum values vs code usage
grep -n "roleEnum\|clinica_owner" apps/api/drizzle/schema.ts apps/api/src/webhooks/stripe-webhook.ts

# DB push dry run
bun run db:push 2>&1 | tail -30
```

---

## Phase 4 — Frontend Patterns

```bash
# mutateAsync without error handling
grep -rln "mutateAsync(" apps/web/src --include="*.tsx" | xargs grep -L "catch\|onError" 2>/dev/null

# console.log in frontend
grep -rn "console\.log\|console\.debug" apps/web/src --include="*.tsx" --include="*.ts" | grep -v "\.test\."

# Global error boundary
grep -rn "ErrorBoundary" apps/web/src/router.tsx apps/web/src/main.tsx 2>/dev/null

# tRPC error link
grep -rn "errorLink\|TRPCLink\|onError" apps/web/src/router.tsx apps/web/src/lib/trpc.ts 2>/dev/null

# Dead anchor links
grep -rn 'href="#' apps/web/src --include="*.tsx"

# Hardcoded hex colors (prohibited)
grep -rn "bg-\[#\|text-\[#\|border-\[#" apps/web/src --include="*.tsx" | grep -v "//.*bg-\["

# External links without noopener
grep -rn 'target="_blank"' apps/web/src --include="*.tsx" | grep -v "noopener\|noreferrer"
```

---

## Phase 5 — Code Quality Patterns

```bash
# Total as any count (track over time)
echo "Backend as any: $(grep -rn ' as any' apps/api/src --include='*.ts' | wc -l)"
echo "Frontend as any: $(grep -rn ' as any' apps/web/src --include='*.tsx' --include='*.ts' | wc -l)"

# Manual admin checks (should use adminProcedure)
grep -rn 'role.*===.*"admin"\|role.*===.*"clinica_owner"' apps/api/src/routers --include="*.ts"

# God components (>400 lines)
find apps/web/src -name "*.tsx" | while read f; do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt 400 ]; then echo "$lines $f"; fi
done | sort -rn | head -10
```
