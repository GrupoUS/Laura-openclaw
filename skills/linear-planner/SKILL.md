---
name: linear-planner
description: "Research-backed task planning skill with Linear integration."
metadata: {"openclaw":{"emoji":"📅"}}
---

# Linear Planner Skill

## Overview

> Research-backed task planning skill with Linear integration. This skill transforms requests into atomic tasks tracked in the Benício project, with R.P.I.V workflow (Research → Plan → Implement → Validate). Use when planning code changes, responding to Linear issues, or tracking work progress.


Research-first planning methodology with full Linear integration for task tracking.

> **Core Principle:** Every task tracked in Linear | Atomic subtasks | Dynamic status updates

## Activation Triggers

This skill is **mandatory** when:

1. Planning any code change or feature
2. Responding to new issues from Linear
3. User requests task decomposition
4. Work requires progress tracking
5. Multi-step execution with validation

**Skip for:** Simple Q&A, quick fixes solvable in one step.

---

## R.P.I.V Workflow

### Phase 0: RESEARCH (Always First)

Understand the request and existing patterns.

**Priority order:**

1. Search codebase for patterns, conventions
2. Query docs for APIs and best practices
3. Check existing Linear issues for context
4. Review related files and dependencies

### Phase 1: PLAN (Create Linear Issue)

Convert research into tracked Linear issue with atomic subtasks.

**Each subtask must have:**

- Clear action verb + specific target
- Acceptance criteria
- Estimated complexity (S/M/L)
- Dependencies mapped

**Output:** Linear issue in [Benício project](https://linear.app/gpus/project/benicio-7aa0c62c6da4)

> See `references/linear-integration.md` for Linear MCP tools.

### Phase 2: IMPLEMENT (Execute Subtasks)

Execute per atomic subtask with status updates.

**Pattern:** Set In Progress → Execute → Validate → Set Done

**For each subtask:**

1. Update Linear status to In Progress
2. Execute the action
3. Validate completion
4. Update Linear status to Done
5. Add comment with result

### Phase 3: VALIDATE (Always)

- All subtasks marked Done
- Acceptance criteria met
- Build/lint/test passing
- Update parent issue status

---

## Linear Integration

### Default Project

All tasks tracked in: **[Benício](https://linear.app/gpus/project/benicio-7aa0c62c6da4)** (`benicio-7aa0c62c6da4`)

### Status Workflow

```
Todo → In Progress → Done
```

### Dynamic Adaptation

When new requests arrive during execution:

1. Analyze priority of new vs current
2. Create new Linear issue
3. Reorder queue if needed
4. Continue execution

> See `references/linear-integration.md` for MCP tool patterns.

---

## Complexity Levels

| Level | Indicators              | Subtasks | Time Est.  |
| ----- | ----------------------- | -------- | ---------- |
| S     | Single file, bug fix    | 1-2      | < 30 min   |
| M     | Multi-file, new feature | 3-5      | 1-3 hours  |
| L     | Architecture, migration | 5-10     | 3-8 hours  |
| XL    | Multi-service, breaking | 10+      | Multi-day  |

---

## Anti-Patterns

| Bad                      | Good                                       |
| ------------------------ | ------------------------------------------ |
| No Linear tracking       | Always create issue before starting        |
| Giant monolith tasks     | Decompose into atomic subtasks             |
| Forget status updates    | Update In Progress → Done as executing     |
| Skip new request         | Create issue, reorder queue, continue      |
| Abandon incomplete work  | Mark blocked/paused with reason in comment |

---

## Quick Reference

```
R.P.I.V: RESEARCH → PLAN (Linear Issue) → IMPLEMENT → VALIDATE

LINEAR RULES:
✓ CREATE ISSUE FIRST — before any implementation
✓ ATOMIC SUBTASKS — small, verifiable, tracked
✓ UPDATE STATUS — In Progress when starting, Done when complete
✓ ADAPT DYNAMICALLY — new requests create new issues, reorder queue
✓ NOTHING FORGOTTEN — every request enters Linear
```

---

## Resources

- `references/linear-integration.md` — Linear MCP tools and patterns
- `references/plan-template.md` — Issue structure template
- `references/planning-patterns.md` — Atomic task patterns
