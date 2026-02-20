---
name: performance-optimization
description: Use when optimizing application performance, improving Core Web Vitals, reducing bundle size, profiling slow operations, fixing memory leaks, improving runtime speed, or addressing Neon cold starts. Triggers on performance, optimize, speed, slow, memory, cpu, benchmark, lighthouse, bundle, LCP, INP, CLS, profiling, tRPC slow, Drizzle N+1, Neon cold start, re-render, react-scan.
---

# Performance Optimization Skill

Systematic performance optimization for NeonDash (React 19 + Vite 7 + Hono + tRPC 11 + Drizzle + Neon).

## When to Use

> Run this skill **after** `super-audit` to address P2/performance issues.

### Trigger Symptoms

- Poor Core Web Vitals scores (Lighthouse < 90)
- Dashboard load > 2.0s, API p95 > 200ms
- Neon cold start on first request
- Large bundle (main chunk > 200KB)
- React excessive re-renders (react-scan warnings)
- tRPC procedures timing out
- N+1 query patterns in Drizzle

### Use ESPECIALLY when:

- `bun run build` reveals chunks > 500KB
- `ANALYZE=true bun run build` shows unexpected large deps
- `react-scan` shows re-render hotspots
- Drizzle queries hitting same table repeatedly in a loop

### When NOT to Use

- Bug investigation → use `debugger` skill
- Full regression audit → use `super-audit` skill first
- Security issues → use `security-audit` skill

---

## Core Principle

> "Measure first, optimize second. Profile, don't guess."

---

## NeonDash Performance Targets

| Metric | Current (Audit) | Target | Tool |
|--------|----------------|--------|------|
| Dashboard Load | 3.2s | ≤ 1.4s | Lighthouse |
| API p95 | 450ms | ≤ 140ms | tRPC devtools |
| LCP | — | ≤ 2.5s | DevTools |
| INP | — | ≤ 200ms | DevTools |
| CLS | — | ≤ 0.1 | DevTools |
| Main bundle | — | ≤ 200KB | Vite |

---

## Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤ 2.5s | 2.5–4.0s | > 4.0s |
| INP | ≤ 200ms | 200–500ms | > 500ms |
| CLS | ≤ 0.1 | 0.1–0.25 | > 0.25 |

---

## Analysis Commands

```bash
# Bundle analysis
ANALYZE=true bun run build          # Vite bundle visualizer

# Type check + lint (establish baseline)
bun run check
bun run lint:check

# Memory heap + CPU profiling
# → Chrome DevTools → Performance / Memory tabs (open staging URL)
```

---

## Optimization Decision Tree

```
What's slow?
│
├── Initial page load
│   ├── LCP high → Optimize critical rendering path
│   ├── Large bundle → Route code splitting, lazy() for heavy pages
│   └── Neon cold start → Ensure connection pooling (PgBouncer)
│
├── Interaction sluggish (INP high)
│   ├── Re-renders → react-scan → useMemo/useCallback/memo
│   ├── Long tRPC calls → Add DB index / use select() not *
│   └── Layout thrashing → Batch DOM reads/writes
│
├── API p95 high
│   ├── N+1 queries → Batch with with() or Promise.all
│   ├── Missing index → see Database Performance section
│   └── Neon cold start → connection pooling
│
└── Memory issues
    ├── Leaks → Clean up listeners, refs on unmount
    └── Growth → Profile heap, reduce state retention
```

---

## Bundle Optimization

### Analysis Commands

```bash
# Vite bundle analyzer
ANALYZE=true bun run build

# Check chunk sizes
du -sh dist/assets/*.js | sort -h | tail -20
```

### Strategies

| Problem | Solution |
|---------|----------|
| Large main bundle | Route-based code splitting |
| Unused code | Tree shaking, remove dead imports |
| Big libraries | Import only needed parts (e.g., `date-fns/format`) |
| Duplicate deps | `bun dedupe` |

### Code Splitting Pattern

```typescript
// Route-based splitting (already used in NeonDash)
const DashboardPage = lazy(() => import('./DashboardPage'));
const SettingsPage = lazy(() => import('./SettingsPage'));

// Conditional heavy feature
const HeavyChart = lazy(() => import('./HeavyChart'));
```

---

## Rendering Performance

### React Optimization (NeonDash Stack)

| Problem | Detection | Solution |
|---------|-----------|----------|
| Unnecessary re-renders | react-scan | `React.memo` for expensive components |
| Expensive calculations | Profiler | `useMemo` with specific deps |
| Unstable callbacks | react-scan | `useCallback` for child props |
| Large lists | Visual lag | `@tanstack/virtual` |

### Anti-Patterns to Avoid

```typescript
// ❌ Inline function in render
<Child onClick={() => doSomething()} />

// ✅ Stable callback
const handleClick = useCallback(() => doSomething(), [deps]);
<Child onClick={handleClick} />

// ❌ Inline object creation
<Child style={{ margin: 10 }} />

// ✅ Stable reference
const style = useMemo(() => ({ margin: 10 }), []);
<Child style={style} />
```

---

## Database Performance (NeonDash Specifics)

### N+1 Detection (tRPC + Drizzle)

```bash
# Find N+1 patterns: loops with db queries inside
grep -rn "for.*await db\.\|\.map.*async.*db\.\|forEach.*await db\." apps/api/src --include="*.ts"
```

**N+1 Anti-pattern:**
```typescript
// ❌ N+1 — one query per lead
const leads = await db.select().from(leads).limit(50);
const leadsWithClients = await Promise.all(
  leads.map(async (lead) => {
    const client = await db.select().from(clients)
      .where(eq(clients.id, lead.clientId)).limit(1);
    return { ...lead, client: client[0] };
  })
);

// ✅ Single query with join
const leadsWithClients = await db
  .select({ lead: leads, client: clients })
  .from(leads)
  .leftJoin(clients, eq(clients.id, leads.clientId))
  .limit(50);
```

### FK Index Audit

Before optimizing any query, verify Foreign Key columns have indexes:

```bash
# See all FK references
grep -n "\.references(" apps/api/drizzle/schema*.ts | head -40

# See existing indexes
grep -n "index(" apps/api/drizzle/schema.ts | head -40
```

**Index Template:**
```typescript
// In table definition
fkNameIdx: index("table_column_idx").on(table.columnName),
```

### Neon Cold Starts

If the first request after idle takes > 1s:
- Verify connection is going through **PgBouncer** (pooling)
- Check Neon connection string ends with `-pooler.neon.tech`
- Avoid direct connections in serverless/edge paths

### Query Optimization

```sql
-- Explain plan (run via Neon Console or drizzle)
EXPLAIN ANALYZE SELECT ...;

-- Add missing index
CREATE INDEX CONCURRENTLY idx_table_column ON table(column);
```

---

## Memory Leak Detection

### Common Causes in NeonDash

| Cause | Detection | Fix |
|-------|-----------|-----|
| tRPC subscriptions | Growing heap | Cleanup on component unmount |
| Event listeners | DevTools Event Listeners panel | Remove in useEffect cleanup |
| Intervals | Heap snapshots | `clearInterval` on unmount |
| WebSocket / SSE | Network tab | Close connection on cleanup |

### Prevention Pattern

```typescript
useEffect(() => {
  const timer = setInterval(callback, 1000);
  const handler = () => {};
  window.addEventListener('resize', handler);

  return () => {
    clearInterval(timer);
    window.removeEventListener('resize', handler);
  };
}, []);
```

---

## Profiling Workflow

**Step 1: Measure**

| Tool | What It Measures |
|------|-----------------|
| Lighthouse (Staging) | Core Web Vitals, opportunities |
| Chrome DevTools → Performance | Runtime, CPU, re-renders |
| Chrome DevTools → Memory | Heap snapshots, leaks |
| react-scan | React re-render hotspots |
| `ANALYZE=true bun run build` | Bundle composition |

**Step 2: Identify**

1. Find the biggest bottleneck (usually: bundle size OR N+1 OR missing index)
2. Quantify the expected improvement
3. Prioritize by user-perceived impact

**Step 3: Fix & Validate**

1. Make one targeted change
2. Re-measure (same tool, same conditions)
3. Confirm improvement (check metric moved)
4. Document in PR description

---

## Quick Wins Checklist

### Database

- [ ] Every FK column has a named index (see `super-audit` Phase 3)
- [ ] No `SELECT *` — use `select({ col: table.col })`
- [ ] Lists always have `limit` (never unbounded)
- [ ] N+1 patterns replaced with single join query

### Frontend

- [ ] Route-based code splitting with `lazy()`
- [ ] Heavy modals/drawers loaded lazily
- [ ] react-scan: 0 re-render hotspots on main flows
- [ ] Images: lazy loading + correct dimensions + WebP

### JavaScript

- [ ] No unused dependencies (`bun dedupe`)
- [ ] Dead code removed (tree shaking helps but explicit removal is better)

### Caching

- [ ] Static assets have long-term cache headers (Vite adds content hash)
- [ ] `/api/health` cached at CDN or proxy level

---

## Anti-Patterns

| Don't | Do |
|-------|-----|
| Optimize without measuring | Profile first with real data |
| Premature optimization | Fix real bottlenecks first |
| Over-memoize | Memoize only expensive (> 1ms) calculations |
| Ignore perceived performance | Prioritize UX, not just metrics |
| Guess the bottleneck | Use react-scan + Lighthouse + EXPLAIN ANALYZE |

---

## Reporting Template

```markdown
## Performance Audit — [Date]

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Dashboard Load | X s | Y s | Z% |
| API p95 | X ms | Y ms | Z% |
| LCP | X ms | Y ms | Z% |
| Bundle (main) | X KB | Y KB | Z% |

### Changes Made
1. [Change → Metric improved]
2. [Change → Metric improved]
```
