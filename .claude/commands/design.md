---
description: Canonical design workflow. 3-phase pipeline: Prototype → Convert → Validate.
---

# /design — Design Workflow

> Orchestration-only. Deep policy lives in `frontend-rules/SKILL.md` and `frontend-design@claude-plugins-official`.

---

## 0. ASSESS COMPLEXITY

| Complexity | Pattern | When |
|------------|---------|------|
| **L1-L2** | Direct code | Bug fix, simple tweak |
| **L3** | Single agent | Component, known pattern |
| **L4-L5** | Multiple subagents | New feature, multi-component |
| **L6+** | Agent Team | Full page, complex UX |

---

## 1. Agent Selection

| Task Type | Agent | Parallel? |
|-----------|-------|-----------|
| Component | frontend-specialist | No |
| New page | frontend-specialist | No |
| Accessibility test | test-engineer | No |
| Performance review | performance-optimizer | No |
| SEO meta | seo-specialist | No |
| **Multi-review (L5+)** | Multiple agents | **YES** |

---

## 2. Parallel Patterns

### Pattern 1: L1-L2 - Direct

```
Simple tweak → Fix directly
```

### Pattern 2: L3 - Single Agent

```typescript
Task({
  subagent_type: "frontend-specialist",
  prompt: "Implement [component] following frontend-rules"
})
```

### Pattern 3: L4-L5 - Multiple Agents (Parallel)

```typescript
// Design + Review in PARALLEL
Task({
  subagent_type: "frontend-specialist",
  name: "design-main",
  prompt: "Design and implement [feature]",
  run_in_background: true
})

Task({
  subagent_type: "test-engineer",
  name: "a11y-review",
  prompt: "Review [feature] for accessibility issues",
  run_in_background: true
})

Task({
  subagent_type: "performance-optimizer",
  name: "perf-review",
  prompt: "Review [feature] for performance issues",
  run_in_background: true
})
```

### Pattern 4: L6+ - Agent Team

```typescript
TeamCreate({ team_name: "design-{slug}" })

TaskCreate({ subject: "Design UI", owner: "frontend-specialist" })
TaskCreate({ subject: "Accessibility review", owner: "test-engineer" })
TaskCreate({ subject: "Performance review", owner: "performance-optimizer" })

TaskUpdate({ taskId: "1", owner: "frontend-specialist" })
TaskUpdate({ taskId: "2", owner: "test-engineer" })
TaskUpdate({ taskId: "3", owner: "performance-optimizer" })
```

---

## 3. Skills to Load

```yaml
ALWAYS:
  - frontend-rules     # Code standards + GPUS
  - frontend-design    # Creative design + Stitch

OPTIONAL:
  - performance-optimization  # Core Web Vitals
  - seo-optimization         # Meta/structured data
  - mobile-development       # React Native/Flutter
```

---

## 4. 3-Phase Pipeline

### Phase 1 — Prototype (Stitch MCP)

**When:** New pages, landing pages
**Skip:** Components, bug fixes

1. Write prompt using GPUS Stitch Template
2. `mcp_stitch_generate_screen_from_text`
3. Review → iterate if needed
4. `mcp_stitch_get_screen` → download HTML

### Phase 2 — Convert to React

1. Break into components (max ~150 lines)
2. Use shadcn/ui primitives
3. Map to GPUS tokens
4. Add tRPC queries
5. TypeScript interfaces

### Phase 3 — Validate

**UX Quality:**
- [ ] Loading states (skeletons)
- [ ] Error states
- [ ] Empty states
- [ ] Keyboard navigation
- [ ] Focus visible
- [ ] Touch targets ≥ 44px

**Visual Quality:**
- [ ] GPUS tokens only
- [ ] Dark mode tested
- [ ] Responsive breakpoints

**Code Quality:**
- [ ] shadcn/ui primitives
- [ ] No barrel imports
- [ ] `bun run check`
- [ ] `bun run lint:check`

---

## 5. Decision Tree

```
START: /design [task]

├─► Is it a BUG FIX?
│     └─► YES → Direct fix
│
├─► Is it a COMPONENT?
│     └─► YES → Single agent (Phase 2 → 3)
│
├─► Does it need DESIGN PROTOTYPE?
│     ├─► YES → Phase 1 → Phase 2 → Phase 3
│     └─► NO  → Phase 2 → Phase 3
│
├─► Need MULTIPLE REVIEWS?
│     ├─► YES → Parallel agents
│     └─► NO  → Single agent
│
└─► Is it L6+ (complex)?
      └─► YES → Agent Team
```

---

## Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|------|
| Hardcode colors | Use GPUS tokens |
| Custom modal | shadcn/ui Dialog |
| Skip UX validation | Loading/error/empty first |
| Nested ScrollArea | Single at layout level |
| Components in `ui/` | `components/[feature]/` |

---

## References

- `.claude/skills/frontend-rules/SKILL.md` — Code standards
- `frontend-design@claude-plugins-official` — Creative design
- `.claude/skills/planning/SKILL.md` — Agent patterns
