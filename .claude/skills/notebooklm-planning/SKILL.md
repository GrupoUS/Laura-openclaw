---
name: notebooklm-planning
description: Use when creating project notebooks for persistent knowledge management, when synthesizing research across multiple sources during planning, when the user mentions NotebookLM or wants a "project brain", or when generating audio/video summaries of project decisions. Use ESPECIALLY when running /plan with research-heavy tasks requiring multi-source aggregation.
---

# NotebookLM Planning Integration

Persistent project knowledge management through NotebookLM CLI (`nlm`).

> **Core value:** Every `/plan` session can create a durable, queryable "project brain" that persists across sessions and synthesizes research from all sources.

## When to Use

- User explicitly mentions "NotebookLM", "project notebook", or "project brain"
- Planning task involves multi-source research aggregation
- User wants persistent project knowledge across sessions
- User requests audio/video summaries of project decisions
- `.agent/notebooklm/config.json` exists with `"enabled": true`

**When NOT to use:**
- Simple L1-L3 tasks with no research phase
- User has no `nlm` CLI installed (check with `which nlm`)
- User has not authenticated (check with `nlm doctor`)

## Prerequisites

Before using any NotebookLM features, verify:

```bash
# 1. CLI installed?
which nlm

# 2. Auth valid?
nlm doctor

# 3. If auth expired:
nlm login
```

**If either check fails:** Skip all NotebookLM hooks. Continue workflow normally. Log a note: "NotebookLM unavailable — skipping knowledge management hooks."

## D.R.P.I.V Integration Hooks

### Phase 0: DISCOVER — Notebook Bootstrapping

**When:** After requirements are clarified and scope is defined.

**Notebook strategy:**
- **Always create a NEW notebook** for each planning session
- **Only reuse** an existing notebook if the planning topic is the **exact same feature/subject** as a previous notebook
- To check: `nlm notebook list` — scan titles for a match on the current topic
- If no match → create new. If match → reuse that notebook ID

```bash
# 1. Check for existing notebook on this topic
nlm notebook list

# 2. If no match — create new notebook (default)
nlm notebook create "Neondash - Feature Description"
# Output: ✓ Created notebook: ...
#   ID: <notebook-id>

# 3. Set alias for convenience
nlm alias set project-slug <notebook-id>

# 4. Add project context as sources
nlm source add project-slug --text "Requirements: ..." --title "Project Requirements" --wait
nlm source add project-slug --file docs/existing-prd.md --wait  # If exists
```

> **Do NOT reuse notebooks from unrelated topics.** Each planning session gets its own dedicated notebook unless it is a continuation of the exact same feature.

### Phase 1: RESEARCH — Knowledge Aggregation

**When:** During the research cascade (after codebase search, before/alongside Context7 and Tavily).

```bash
# Deep web research with auto-import to notebook
nlm research start "query terms" \
  --notebook-id <id> \
  --mode deep

# Poll until complete
nlm research status <notebook-id> --max-wait 300

# Import discovered sources
nlm research import <notebook-id> <task-id>

# Add manually discovered sources
nlm source add <notebook-id> --url "https://relevant-article.com" --wait
nlm source add <notebook-id> --youtube "https://youtube.com/watch?v=..." --wait

# Extract synthesized findings
nlm notebook query <notebook-id> "Summarize key technical findings with sources"
nlm notebook query <notebook-id> "List all edge cases mentioned across sources"
nlm notebook query <notebook-id> "Extract security considerations"
```

**Inject query results** into the Research Summary findings table with `Source: NotebookLM`.

### Phase 2: PLAN — Validation & Gap Analysis

**When:** After generating the plan file, before presenting to user.

```bash
# Add generated plan as source
nlm source add <notebook-id> --file docs/PLAN-slug.md --title "Implementation Plan" --wait

# Validate plan against research
nlm notebook query <notebook-id> "Does this plan address all findings? What's missing?"
nlm notebook query <notebook-id> "Identify potential risks not covered in the plan"
nlm notebook query <notebook-id> "Are there contradictions between the plan and research sources?"
```

**Act on validation results:** Update the plan if NotebookLM identifies gaps.

### Phase 3: IMPLEMENT — Decision Logging

**When:** During implementation, after significant decisions or milestones.

```bash
# Log implementation decisions
nlm source add <notebook-id> --text "Decision: Chose X over Y because..." --title "Implementation Decision" --wait

# Log blockers or pivots
nlm source add <notebook-id> --text "Blocker found: ..." --title "Implementation Note" --wait
```

### Phase 4: VALIDATE — Retrospective Content

**When:** After implementation is complete and validated.

```bash
# Generate project retrospective content
nlm audio create <notebook-id> --format deep_dive --length long --confirm
nlm studio status <notebook-id>  # Poll until ready

# Generate briefing doc for stakeholders
nlm report create <notebook-id> --format "Briefing Doc" --confirm

# Create flashcards for team knowledge transfer
nlm flashcards create <notebook-id> --difficulty medium --confirm

# Download artifacts
nlm download audio <notebook-id> <artifact-id> --output docs/retrospective.mp3
nlm download report <notebook-id> <artifact-id> --output docs/briefing.md
```

## Quick Reference

| Operation | Command |
|-----------|---------|
| Create notebook | `nlm notebook create "Title"` |
| Set alias | `nlm alias set <name> <id>` |
| Add URL source | `nlm source add <nb> --url "..." --wait` |
| Add text source | `nlm source add <nb> --text "..." --title "..." --wait` |
| Add file source | `nlm source add <nb> --file path.md --wait` |
| Web research | `nlm research start "query" --notebook-id <id> --mode deep` |
| Query notebook | `nlm notebook query <nb> "question"` |
| Check auth | `nlm doctor` |
| Re-authenticate | `nlm login` |

> See `references/cli-reference.md` for the complete command reference.
> See `references/workflow-hooks.md` for detailed per-phase usage examples.
> See `references/troubleshooting.md` for error recovery procedures.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using NotebookLM without checking `which nlm` first | Always verify CLI is installed before any operation |
| Not using `--wait` when adding sources | Sources aren't queryable until processed — use `--wait` |
| Creating duplicate notebooks for same project | Check `.agent/notebooklm/notebooks.json` cache first |
| Ignoring auth failures | Run `nlm login` immediately, or skip all NLM hooks |
| Exceeding rate limit (50 queries/day) | Batch queries, cache results, check threshold |
| Running NLM commands without `--json` for parsing | Always use `--json` when you need to extract IDs |
| Making NotebookLM mandatory in workflow | Every NLM hook is **optional** — workflow must work without it |

## Constraints

- **Rate limit:** ~50 queries/day on free tier
- **Auth sessions:** ~20 minutes, then need `nlm login` refresh
- **Unofficial API:** May break without notice — always handle failures gracefully
- **Privacy:** Never auto-share notebooks publicly without explicit user consent
- **No blocking:** Never let a NotebookLM failure block the main workflow
