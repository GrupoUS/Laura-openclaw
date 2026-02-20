# React Best Practices

> Adapted from [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) for **React 19 + Vite + tRPC + Tanstack Query** stack.

---

## 1. Eliminating Waterfalls (CRITICAL)

### `async-parallel` — Parallelize independent operations

```tsx
// ❌ Sequential waterfall
const user = await getUser();
const posts = await getPosts();

// ✅ Parallel fetching
const [user, posts] = await Promise.all([getUser(), getPosts()]);
```

### `async-defer-await` — Move `await` into branches where actually used

```tsx
// ❌ Awaits even when not needed
const data = await fetchData();
if (condition) return data;
return cachedData;

// ✅ Defer await to branch
const dataPromise = fetchData();
if (condition) return await dataPromise;
return cachedData;
```

### `async-suspense` — Use Suspense to stream content progressively

```tsx
// ✅ Stream independent sections
<Suspense fallback={<KPISkeleton />}>
  <KPICards />
</Suspense>
<Suspense fallback={<ChartSkeleton />}>
  <RevenueChart />
</Suspense>
```

### `async-trpc-parallel` — Parallel tRPC queries (project-specific)

```tsx
// ❌ Sequential tRPC calls
const { data: leads } = trpc.leads.list.useQuery();
// Waits for first before starting second

// ✅ Use useSuspenseQueries or parallel useQuery
const leadsQuery = trpc.leads.list.useQuery();
const statsQuery = trpc.dashboard.stats.useQuery();
// Both fire simultaneously
```

---

## 2. Bundle Size Optimization (CRITICAL)

### `bundle-barrel-imports` — Import directly, avoid barrel files

```tsx
// ❌ Barrel import pulls entire module tree
import { Button, Card, Modal } from "@/components";

// ✅ Direct imports enable tree-shaking
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

### `bundle-namespace-imports` — Avoid `import *`

```tsx
// ❌ Imports everything
import * as Icons from "lucide-react";

// ✅ Named imports only
import { Home, Settings, User } from "lucide-react";
```

### `bundle-dynamic-imports` — Lazy-load heavy components

```tsx
import { lazy, Suspense } from "react";

const HeavyChart = lazy(() => import("@/components/dashboard/HeavyChart"));

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart />
    </Suspense>
  );
}
```

### `bundle-conditional` — Load modules only when feature is activated

```tsx
// ✅ Import only when needed
async function exportToPDF() {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  // ...
}
```

### `bundle-preload` — Preload on hover/focus for perceived speed

```tsx
// ✅ Start loading before click
<Link
  to="/settings"
  onMouseEnter={() => import("@/pages/SettingsPage")}
>
  Settings
</Link>
```

---

## 3. Data Fetching with tRPC + Tanstack Query (HIGH)

### `data-trpc-prefetch` — Prefetch data for faster navigation

```tsx
// ✅ Prefetch on hover
const utils = trpc.useUtils();

<button onMouseEnter={() => utils.leads.getById.prefetch({ id })}>
  View Lead
</button>
```

### `data-stale-time` — Configure sensible stale times

```tsx
// ❌ Default 0ms = refetch on every focus
trpc.dashboard.stats.useQuery();

// ✅ Set stale time for data that doesn't change every second
trpc.dashboard.stats.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### `data-select` — Select only needed fields to reduce re-renders

```tsx
// ✅ Component only re-renders when selected value changes
const totalLeads = trpc.leads.list.useQuery(undefined, {
  select: (data) => data.length,
});
```

### `data-optimistic` — Use optimistic updates for responsive UI

```tsx
// ✅ Update UI immediately, rollback on error
const mutation = trpc.leads.updateStatus.useMutation({
  onMutate: async (newData) => {
    await utils.leads.list.cancel();
    const previous = utils.leads.list.getData();
    utils.leads.list.setData(undefined, (old) =>
      old?.map((l) => (l.id === newData.id ? { ...l, ...newData } : l))
    );
    return { previous };
  },
  onError: (_err, _vars, context) => {
    utils.leads.list.setData(undefined, context?.previous);
  },
  onSettled: () => utils.leads.list.invalidate(),
});
```

---

## 4. Re-render Optimization (MEDIUM)

### `rerender-children` — Pass children as props to avoid re-renders

```tsx
// ❌ StatefulWrapper re-renders children on every state change
function StatefulWrapper() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c + 1)}>+</button>
      <ExpensiveComponent /> {/* re-renders unnecessarily */}
    </div>
  );
}

// ✅ Children don't re-render when parent state changes
function StatefulWrapper({ children }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c + 1)}>+</button>
      {children}
    </div>
  );
}
```

### `rerender-derived-state` — Derive state during render, not effects

```tsx
// ❌ Effect to derive state
const [filteredItems, setFilteredItems] = useState([]);
useEffect(() => {
  setFilteredItems(items.filter(i => i.active));
}, [items]);

// ✅ Compute during render
const filteredItems = useMemo(
  () => items.filter(i => i.active),
  [items]
);
```

### `rerender-functional-setstate` — Functional setState for stable callbacks

```tsx
// ❌ Callback recreated every render due to count dependency
const increment = useCallback(() => setCount(count + 1), [count]);

// ✅ Stable callback, no dependency on count
const increment = useCallback(() => setCount(c => c + 1), []);
```

### `rerender-lazy-state-init` — Pass function to useState for expensive init

```tsx
// ❌ Expensive computation runs every render
const [data] = useState(parseCSV(rawData));

// ✅ Runs only on first render
const [data] = useState(() => parseCSV(rawData));
```

### `rerender-memo-default-props` — Hoist default non-primitive props

```tsx
// ❌ New object every render breaks memoization
function Component({ options = {} }) { ... }

// ✅ Stable default
const DEFAULT_OPTIONS = {};
function Component({ options = DEFAULT_OPTIONS }) { ... }
```

### `rerender-transitions` — Use startTransition for non-urgent updates

```tsx
import { useTransition } from "react";

const [isPending, startTransition] = useTransition();

function handleSearch(query: string) {
  // Immediate: update input
  setSearchQuery(query);
  // Deferred: update filtered results
  startTransition(() => setFilteredResults(filter(allData, query)));
}
```

### `rerender-ref-transient` — Use refs for transient frequent values

```tsx
// ❌ State causes re-render on every mouse move
const [pos, setPos] = useState({ x: 0, y: 0 });

// ✅ Ref + direct DOM update for smooth animation
const posRef = useRef({ x: 0, y: 0 });
const handleMove = (e) => {
  posRef.current = { x: e.clientX, y: e.clientY };
  elementRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
};
```

---

## 5. Rendering Performance (MEDIUM)

### `rendering-conditional` — Use ternary, not `&&` for conditionals

```tsx
// ❌ Can render "0" or "false" as text
{count && <Badge>{count}</Badge>}

// ✅ Always renders element or null
{count > 0 ? <Badge>{count}</Badge> : null}
```

### `rendering-hoist-jsx` — Extract static JSX outside components

```tsx
// ❌ Recreated every render
function Component() {
  const header = <h1>Dashboard</h1>;
  return <div>{header}{/* dynamic content */}</div>;
}

// ✅ Created once
const HEADER = <h1>Dashboard</h1>;
function Component() {
  return <div>{HEADER}{/* dynamic content */}</div>;
}
```

### `rendering-content-visibility` — Use content-visibility for long lists

```css
/* Cards below the fold render lazily */
.card-grid > * {
  content-visibility: auto;
  contain-intrinsic-size: 0 200px;
}
```

### `rendering-virtualize` — Virtualize large lists (>50 items)

```tsx
// ✅ Use @tanstack/react-virtual or virtua for large lists
import { useVirtualizer } from "@tanstack/react-virtual";
```

### `rendering-animate-wrapper` — Animate div wrapper, not SVG element

```tsx
// ❌ SVG transforms are expensive
<motion.svg animate={{ rotate: 360 }}>

// ✅ Animate wrapper instead
<motion.div animate={{ rotate: 360 }}>
  <svg>...</svg>
</motion.div>
```

---

## 6. JavaScript Performance (LOW-MEDIUM)

### `js-set-map-lookups` — Use Set/Map for O(1) lookups

```tsx
// ❌ O(n) on every check
const isSelected = selectedIds.includes(id);

// ✅ O(1) lookup
const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
const isSelected = selectedSet.has(id);
```

### `js-combine-iterations` — Combine multiple filter/map into one loop

```tsx
// ❌ 3 iterations
const result = items.filter(f).map(m).filter(f2);

// ✅ Single iteration
const result = items.reduce((acc, item) => {
  if (f(item) && f2(m(item))) acc.push(m(item));
  return acc;
}, []);
```

### `js-early-exit` — Return early from functions

```tsx
// ❌ Deep nesting
function process(data) {
  if (data) {
    if (data.items) {
      return data.items.map(transform);
    }
  }
  return [];
}

// ✅ Early exits
function process(data) {
  if (!data?.items) return [];
  return data.items.map(transform);
}
```

### `js-tosorted-immutable` — Use toSorted() for immutable sorting

```tsx
// ❌ Mutates original array
const sorted = items.sort((a, b) => a.name.localeCompare(b.name));

// ✅ Returns new array
const sorted = items.toSorted((a, b) => a.name.localeCompare(b.name));
```

---

## 7. Advanced Patterns (LOW)

### `advanced-init-once` — Initialize app-level logic once

```tsx
// ✅ Module-level init (runs once per app load)
let initialized = false;
function initAnalytics() {
  if (initialized) return;
  initialized = true;
  // setup...
}
```

### `advanced-event-handler-refs` — Store handlers in refs for stable identity

```tsx
const handlerRef = useRef(handler);
handlerRef.current = handler;

useEffect(() => {
  const listener = (e) => handlerRef.current(e);
  window.addEventListener("resize", listener);
  return () => window.removeEventListener("resize", listener);
}, []); // No dependency on handler
```

---

## Quick Reference Table

| Priority | Category | Rules | Impact |
|----------|----------|-------|--------|
| 1 | Eliminating Waterfalls | `async-*` | CRITICAL |
| 2 | Bundle Size Optimization | `bundle-*` | CRITICAL |
| 3 | Data Fetching (tRPC) | `data-*` | HIGH |
| 4 | Re-render Optimization | `rerender-*` | MEDIUM |
| 5 | Rendering Performance | `rendering-*` | MEDIUM |
| 6 | JavaScript Performance | `js-*` | LOW-MEDIUM |
| 7 | Advanced Patterns | `advanced-*` | LOW |
