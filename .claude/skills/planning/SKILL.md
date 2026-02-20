---
name: planning
description: Use when the /plan command is executed, when creating implementation plans or architectural designs, when tasks have high uncertainty requiring research before coding, when brainstorming new features to clarify requirements before implementation, when feature scope keeps expanding, when implementation started without clear requirements, when multiple approaches exist with unclear trade-offs, when third-party API integration is needed, or when the user asks "how should we build X".
---

# Planning Skill — D.R.P.I.V Methodology

> **Authority:** Canonical methodology for planning AND brainstorming.
> **Orchestration:** `.claude/commands/plan.md` — agent spawning patterns.
> **Execution:** `.claude/agents/project-planner.md` — plan creation.

---

## HARD GATE

<EXTREMELY-IMPORTANT>
Do NOT write any code until you have:
1. Presented a design
2. Received user approval

This applies to EVERY project regardless of perceived simplicity.
</EXTREMELY-IMPORTANT>

---

## When to Use

### Trigger Symptoms
- User executes `/plan` command
- High uncertainty or risk of hallucination
- Multi-step execution requiring decomposition
- Third-party integrations (APIs, frameworks)
- Feature scope keeps expanding
- Multiple valid approaches with unclear trade-offs

### When NOT to Use
- Simple Q&A or explanations
- Single-file bug fixes with clear cause
- Minor adjustments to existing code

---

## D.R.P.I.V Workflow

```
DISCOVER → RESEARCH → PLAN → IMPLEMENT → VALIDATE
    ↓          ↓         ↓         ↓          ↓
  Brainstorm Eliminate  Create   Execute    Verify
  + Design   Unknowns   Runbook  Atomic     Quality
```

> **Phases 0-2 are planning. Phases 3-4 are execution (see /implement).**

---

## Phase 0: DISCOVER (Brainstorming)

**When:** Requirements ambiguous, new features, L6+
**Skip:** Bug fixes, well-scoped tasks, established patterns

### Checklist

1. Explore project context (files, docs, recent commits)
2. Ask clarifying questions **one at a time**
3. Propose 2-3 approaches with trade-offs
4. Present design incrementally, get approval each section
5. Write design doc: `docs/plans/YYYY-MM-DD-<topic>-design.md`
6. Continue to RESEARCH

### Rules

| Rule | Why |
|------|-----|
| One question at a time | Never overwhelm |
| Multiple choice preferred | Easier to answer |
| Lead with recommendation | User wants guidance |
| Incremental validation | Catch misunderstandings early |
| YAGNI ruthlessly | Prevent scope creep |

### Questions (One at a Time)

| Question | Type |
|----------|------|
| "What problem does this solve?" | Purpose |
| "MVP / Standard / Complete?" | Scope |
| "Hard requirements?" | Constraints |
| "How do we know it's done?" | Success |

> See `references/01-discover.md` for full protocol.

---

## Phase 1: RESEARCH

**When:** Always (after discovery if needed)

### Research Cascade

```
1. Codebase → Grep/Glob/Read     → Confidence: 5
2. Context7 → resolve → query    → Confidence: 4-5
3. Tavily → search → extract     → Confidence: 3-4
4. Sequential Thinking           → For synthesis
```

**Stop when confidence ≥ 4 for key findings.**

### Required Output

```markdown
| # | Finding | Confidence (1-5) | Source | Impact |
|---|---------|------------------|--------|--------|
| 1 | ... | 4 | codebase: file.ts | high |

**Knowledge Gaps:** [Unknowns]
**Assumptions:** [To validate]
**Edge Cases:** [Min 5 for L4+]
```

### Confidence Scoring

| Score | Meaning | Action |
|-------|---------|--------|
| **5** | Verified in codebase | Use directly |
| **4** | Multiple sources agree | Use with confidence |
| **3** | Community consensus | Note uncertainty |
| **2** | Single source | Flag as assumption |
| **1** | Speculation | Don't rely on it |

**Rule:** Findings ≤ 2 MUST be flagged.

---

## Phase 2: PLAN

**When:** After research complete
**Save to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

### Plan Header

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence]
**Architecture:** [2-3 sentences]
**Tech Stack:** [Key technologies]
**Complexity:** L[1-10] — [Justification]
```

### Task Granularity

**Each step = ONE action (2-5 minutes):**

```
❌ "Implement auth"
✅ "Add Zod schema for login form"
```

### Task Template

```markdown
### Task N: [Name]

**Files:** `path/file.ts:123-145`

**Step 1:** [Action]
\`\`\`typescript
[code]
\`\`\`

**Step 2:** Validate
\`\`\`bash
bun run check
# Expected: No errors
\`\`\`
```

### Required Task Elements

1. Exact file path with line ranges
2. Complete code (never "add validation")
3. Validation command with expected output
4. Dependencies marked with `⚡ PARALLEL-SAFE`

### Phase Organization

```markdown
### Phase 1: Foundation [SEQUENTIAL]
### Phase 2: Core [PARALLEL]
> ⚡ PARALLEL-SAFE
### Phase 3: Integration [SEQUENTIAL]
```

### L6+ Additions
- **Risk Assessment:** See `references/03-risk.md`
- **ADR:** Document non-obvious decisions

> See `references/02-plan.md` for complete template.

---

## Phase 2.5: SELF-REVIEW

**Before presenting, check:**

| # | Criterion | Check |
|---|-----------|-------|
| 1 | Completeness | Every requirement → task? |
| 2 | Atomicity | Each step = 2-5 min? |
| 3 | Risk coverage | Top risks identified? (L6+) |
| 4 | Dependency order | Can execute in order? |
| 5 | Rollback | Can undo each task? |

**If any fails:** Iterate before presenting.

---

## Complexity Levels

| Level | Indicators | Discovery | L6+ Extras |
|-------|------------|-----------|------------|
| L1-L2 | Bug fix, single file | Skip | None |
| L3-L5 | Feature, multi-file | If ambiguous | None |
| L6-L8 | Architecture, integration | Always | Risk + ADR |
| L9-L10 | Migrations, multi-service | Always | Pre-mortem |

### Complexity Indicators

| +1 to +2 | -1 |
|----------|-----|
| Multi files | Patterns exist |
| DB changes | Similar code |
| Auth | Isolated |
| 3rd party APIs | Tests exist |
| Breaking changes | |
| Security | |

---

## Anti-Patterns

| Bad | Good |
|-----|------|
| "Implement auth" | Discover → Research → Plan |
| Skip research | ALWAYS research first |
| "Add validation" in plan | Provide exact code |
| 5 questions at once | One question at a time |
| Present without self-review | Run 5-criterion check |
| Low-confidence as-is | Flag, validate, alternatives |

---

## Red Flags — STOP

| Red Flag | Action |
|----------|--------|
| Coding before plan approved | Stop. Complete plan first. |
| Plan has "TBD" | Research the unknown NOW. |
| Finding scores ≤ 2 | Find better sources. |
| Self-review failed | Fix plan, don't present. |

---

## Quick Reference

```
D.R.P.I.V: DISCOVER → RESEARCH → PLAN → IMPLEMENT → VALIDATE

GOLDEN RULES:
✓ DESIGN FIRST — present design, get approval
✓ RESEARCH ALWAYS — never implement blind
✓ BITE-SIZED STEPS — each = one action (2-5 min)
✓ EXACT CODE — complete code, never vague
✓ ONE QUESTION — never overwhelm
✓ 2-3 APPROACHES — always explore alternatives
✓ SELF-REVIEW — 5 criteria before presenting
✓ CONFIDENCE TAG — score every finding 1-5
```

---

## References

- `references/01-discover.md` — Brainstorming protocol
- `references/02-plan.md` — Plan template
- `references/03-risk.md` — Pre-mortem + ADR (L6+)
