# D.R.P.I.V Workflow Hooks for NotebookLM

> Detailed per-phase integration guide with concrete examples.

## Prerequisite Check (Run Once Per Session)

Before any NotebookLM operation, execute this guard:

```bash
which nlm && nlm doctor
```

- If `which nlm` fails → **Skip all NLM hooks**, log "NotebookLM CLI not installed"
- If `nlm doctor` reports auth issues → Attempt `nlm login`, if that fails → skip NLM hooks

**Never block the main workflow** for NotebookLM failures.

---

## Phase 0: DISCOVER — Notebook Bootstrapping

**Trigger:** After user requirements are clarified and project scope is defined.

### Step 1: Check for existing notebook on the SAME topic

```bash
nlm notebook list
```

Scan the output for a notebook title matching the current planning topic.

- **Found a match on the same feature/subject** → reuse that notebook ID
- **No match or different topic** → create a new notebook (default)

> **Never reuse notebooks from unrelated topics.** Each planning session gets its own notebook.

### Step 2: Create project notebook (default)

```bash
nlm notebook create "Neondash - Auth System Redesign"
# Expected output: ✓ Created notebook: ...
#   ID: abc123
```

### Step 3: Set alias for convenience

```bash
nlm alias set auth-redesign abc123
```

### Step 4: Load existing project context

```bash
# Add user requirements as text source
nlm source add auth-redesign \
  --text "Requirements: Clerk integration, tRPC endpoints, webhook security..." \
  --title "Project Requirements" \
  --wait

# Add existing architecture docs if available
nlm source add auth-redesign --file AGENTS.md --wait
nlm source add auth-redesign --file docs/existing-plan.md --wait  # If exists
```

---

## Phase 1: RESEARCH — Knowledge Aggregation

**Trigger:** During the research cascade, after codebase search.

### Web Research (Parallel with Tavily/Context7)

```bash
# Start deep research
nlm research start "Clerk Next.js tRPC integration best practices 2026" \
  --notebook-id abc123 \
  --mode deep

# Poll until complete (max 5 min)
nlm research status abc123 --max-wait 300

# Import discovered sources to notebook
nlm research import abc123 <task-id>
```

### Manual Source Addition

Add any valuable URLs discovered via Tavily or manual research:

```bash
nlm source add abc123 --url "https://clerk.com/docs/quickstarts/nextjs" --wait
nlm source add abc123 --youtube "https://youtube.com/watch?v=relevant-video" --wait
```

### Knowledge Extraction Queries

Run targeted queries to synthesize findings:

```bash
# Technical findings
nlm notebook query abc123 "Summarize the key technical findings across all sources"

# Edge cases
nlm notebook query abc123 "List all edge cases and gotchas mentioned in the sources"

# Security considerations
nlm notebook query abc123 "Extract all security considerations and best practices"

# Architecture patterns
nlm notebook query abc123 "What architecture patterns are recommended across sources?"
```

### Inject into Research Summary

Add NotebookLM query results to the plan's Research Summary table:

```markdown
| # | Finding | Confidence | Source | Impact |
|---|---------|-----------|--------|--------|
| 5 | Clerk webhooks require HMAC verification | 4 | NotebookLM Q&A (3 sources cited) | high |
```

---

## Phase 2: PLAN — Validation & Gap Analysis

**Trigger:** After the plan file is generated, before presenting to user.

### Add Plan as Source

```bash
nlm source add abc123 --file docs/PLAN-auth-redesign.md \
  --title "Implementation Plan v1" --wait
```

### Validate Plan Against Research

```bash
# Coverage check
nlm notebook query abc123 \
  "Review this implementation plan against all research findings. What requirements or findings are NOT addressed in the plan?"

# Risk check
nlm notebook query abc123 \
  "Based on all sources, what are the top 3 risks this plan doesn't mitigate?"

# Contradiction check
nlm notebook query abc123 \
  "Are there any contradictions between the plan's approach and the research findings?"
```

### Act on Validation

If NotebookLM identifies gaps:
1. Update the plan file
2. Re-add the updated plan: `nlm source add abc123 --file docs/PLAN-auth-redesign.md --wait`
3. Note the validation in the plan's Research Summary

---

## Phase 3: IMPLEMENT — Decision Logging

**Trigger:** During implementation, after significant decisions.

```bash
# Log architectural decisions
nlm source add abc123 \
  --text "Decision: Used Clerk middleware approach instead of per-route auth because..." \
  --title "ADR: Auth Middleware Strategy" --wait

# Log blockers
nlm source add abc123 \
  --text "Blocker: tRPC v11 doesn't support X, workaround: ..." \
  --title "Implementation Blocker" --wait

# Log pivots
nlm source add abc123 \
  --text "Pivot: Switched from approach A to B because testing revealed..." \
  --title "Implementation Pivot" --wait
```

---

## Phase 4: VALIDATE — Retrospective

**Trigger:** After successful implementation and validation.

### Generate Retrospective Content

```bash
# Audio deep-dive of project learnings
nlm audio create abc123 --format deep_dive --length long --confirm
nlm studio status abc123  # Poll until ready

# Briefing doc for stakeholders
nlm report create abc123 --format "Briefing Doc" --confirm

# Flashcards for team knowledge transfer
nlm flashcards create abc123 --difficulty medium \
  --focus "Focus on architectural decisions and security patterns" --confirm

# Mind map of project knowledge
nlm mindmap create abc123 --confirm
```

### Download Artifacts

```bash
nlm download audio abc123 <artifact-id> --output docs/retrospective-auth.mp3
nlm download report abc123 <artifact-id> --output docs/briefing-auth.md
nlm download flashcards abc123 <artifact-id> --format markdown --output docs/flashcards-auth.md
```

### Share (If Requested)

```bash
nlm share public abc123   # Enable public link for team
nlm share invite abc123 colleague@company.com --role editor
```

---

## Rate Limit Management

Free tier: ~50 queries/day.

**Strategy:**
1. Batch related questions into single queries where possible
2. Cache notebook IDs and query results locally
3. Use `--mode fast` for preliminary research, `--mode deep` only for primary topics
4. Reserve queries for high-value operations (validation, synthesis)
5. If rate limited → log warning and continue workflow without NLM
