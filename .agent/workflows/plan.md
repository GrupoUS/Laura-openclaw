---
title: Plan
description: Unified planning workflow using parallel research tools and structured synthesis. Delegates to planning skill for D.R.P.I.V methodology.
---

# /plan — Intelligent Planning Orchestration

$ARGUMENTS

> **Authority:** `~/.gemini/antigravity/skills/planning/SKILL.md` — D.R.P.I.V methodology

---

## Quick Assessment

```
Is it L1-L2 (bug fix, single file)?
├─► YES → Skip /plan, fix directly
└─► NO  → Continue workflow
```

---

## Workflow (4 Phases)

### Phase 1: DISCOVER (If Ambiguous)

**Trigger:** Requirements unclear, new feature, L6+

Use `notify_user` to ask clarifying questions **one at a time:**

1. Scope: "Full app / module / single file?"
2. Priority: "Security / speed / features?"
3. Constraints: "Timeline / tech / existing code?"

> Skip if request is crystal-clear and well-scoped.

---

### Phase 2: RESEARCH (Parallel)

**Use parallel tool calls to research simultaneously across multiple sources.**

#### Research Streams (execute in parallel)

1. **Codebase Research** — Use `grep_search`, `find_by_name`, `view_file`, `view_file_outline` to:
   - Find existing patterns and conventions
   - Identify files to modify
   - Find related components and dependencies

2. **Official Docs** — Use `mcp_context7_resolve-library-id` + `mcp_context7_query-docs` to:
   - Query up-to-date documentation for relevant libraries
   - Find best practices and gotchas
   - Get code examples

3. **Web Research** — Use `mcp_tavily_search` or `mcp_tavily_searchContext` to:
   - Find community patterns and solutions
   - Research security considerations
   - Identify performance tips

4. **Knowledge Items** — Check existing KIs in `~/.gemini/antigravity/knowledge/` for:
   - Previously documented patterns
   - Known issues and solutions
   - Architecture decisions

#### Research Depth by Complexity

| Complexity | Streams | Depth |
|------------|---------|-------|
| L3 | 1-2 (codebase + docs) | Quick scan |
| L4-L5 | 2-3 (codebase + docs + web) | Thorough |
| L6-L8 | 3-4 (all streams) | Deep dive |
| L9-L10 | All streams + KIs | Exhaustive |

#### Research Output Template

```markdown
| # | Finding | Confidence (1-5) | Source | Impact |
|---|---------|-------------------|--------|--------|
| 1 | ... | 5 | codebase: file.ts | high |

**Knowledge Gaps:** [Unknowns]
**Assumptions:** [To validate]
**Edge Cases:** [Min 5 for L4+]
```

---

### Phase 3: CONSOLIDATE (Create Plan)

After all research completes, synthesize into an implementation plan:

1. **Load planning skill** — `view_file` on `~/.gemini/antigravity/skills/planning/SKILL.md`
2. **Synthesize research** into coherent plan
3. **Create atomic tasks** (2-5 min each)
4. **Mark parallel-safe tasks** with `[PARALLEL]` or `[PARALLEL-SAFE]`
5. **Include exact file paths** with line ranges
6. **Provide complete code changes** (not "add validation here")
7. **Add verification commands** for each task

**Output:** Create `implementation_plan.md` artifact in conversation brain directory.

#### Plan Structure

```markdown
# [Feature Name]

## Research Summary
[Key findings from Phase 2]

## Task Breakdown

### Phase 1: Foundation (SEQUENTIAL)
- [ ] Task 1.1: [Title] — `file.ts:10-25`
- [ ] Task 1.2: [Title] — `file.ts:30-45`

### Phase 2: Core Features [PARALLEL]
⚡ PARALLEL-SAFE
- [ ] Task 2.1: [Backend] — `router.ts`
- [ ] Task 2.2: [Frontend] — `component.tsx`
- [ ] Task 2.3: [Tests] — `test.ts`

### Phase 3: Integration (SEQUENTIAL)
- [ ] Task 3.1: Connect frontend ↔ backend
- [ ] Task 3.2: Integration tests

## Verification Plan
- bun run check
- bun run lint:check
- bun test
```

---

### Phase 4: PRESENT

Use `notify_user` to present the plan for review:

```
✅ Plan created: implementation_plan.md

📊 Analysis:
- Complexity: L{X}
- Research streams: {N} (parallel)
- Parallel tasks: {M}
- Sequential tasks: {K}

📋 Next:
1. /implement → Execute the plan
2. Review → Check implementation_plan.md
3. Modify → Adjust before execution
```

---

## Skill Loading

| Phase | Skills to Load |
|-------|----------------|
| Research | Domain-specific skills as needed |
| Consolidate | `planning` — D.R.P.I.V methodology |
| Execute | Routed by `/implement` workflow |

---

## MCP Tools Reference

| Tool | Purpose | Phase |
|------|---------|-------|
| Context7 (`resolve-library-id` + `query-docs`) | Official library docs | Research |
| Tavily (`search`, `searchContext`, `searchQNA`) | Web research | Research |
| Sequential Thinking | Complex logical problems | Consolidate |
| Clerk Snippets | Official Clerk patterns | Research |

---

## Quick Reference

```
/plan → Research (parallel tools) → Consolidate → Present

L1-L2  → Direct fix (no /plan)
L3     → 1-2 research streams → plan
L4-L5  → 2-3 research streams (parallel) → plan
L6-L8  → 3-4 research streams (parallel) → plan
L9-L10 → All streams (parallel) → plan

ALWAYS:
✓ Research in parallel (parallel tool calls)
✓ Use confidence scores (1-5)
✓ Flag knowledge gaps
✓ Create implementation_plan.md artifact
✓ Present via notify_user for review
```

---

## References

- **Methodology:** `~/.gemini/antigravity/skills/planning/SKILL.md` — D.R.P.I.V workflow
- **Implementation:** `/implement` workflow
- **Debugging:** `/debug` workflow
