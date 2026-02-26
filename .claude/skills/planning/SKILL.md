---
name: planning
description: Use when the /plan command is executed, when creating implementation plans or architectural designs, when tasks have high uncertainty requiring research before coding, when brainstorming new features, when feature scope keeps expanding, when multiple approaches exist with unclear trade-offs, when third-party API integration is needed, when web scraping, crawling, or structured data extraction is required, when NotebookLM knowledge synthesis or project memory is needed, or when the user asks "how should we build X".
---

# Planning Skill — D.R.P.I.V Methodology

> **Authority:** Canonical methodology for planning, brainstorming, web research, and knowledge synthesis.
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
- Web scraping, structured data extraction, or site crawling needed
- Multi-source research aggregation required
- User mentions "NotebookLM", "project notebook", or "project brain"

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

> See `references/01-discover.md` for full protocol.

---

## Phase 1: RESEARCH

**When:** Always (after discovery if needed)

### Research Cascade

```
1. Codebase → Grep/Glob/Read          → Confidence: 5
2. Tavily → search/context/QNA        → Confidence: 4-5
3. Crawl4AI → extract/scrape          → Confidence: 4-5 (live data)
4. NotebookLM → project memory        → Confidence: 4-5 (validation)
5. Sequential Thinking                → For synthesis
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

## Phase 1A: Web Extraction (Crawl4AI) — Optional

Use when research requires live web data, structured scraping, or documentation extraction from external sites.

### Prerequisites

```bash
crawl4ai-doctor   # Verify installation
# If issues: crawl4ai-setup
```

### When to Use

| Trigger | Action |
|---------|--------|
| External API docs needed | Crawl docs site, extract markdown |
| Structured data from websites | Schema-based CSS/JSON extraction |
| Competitor/market research | Batch multi-URL crawl |
| JavaScript-heavy pages | Dynamic content handling |

### Extraction Decision Tree

```
Structured, repetitive data? → Schema-based (no LLM, most efficient)
  └─► Generate schema once: scripts/extraction_pipeline.py --generate-schema <url> "<instruction>"
  └─► Reuse:               scripts/extraction_pipeline.py --use-schema <url> generated_schema.json

Irregular or one-time?       → LLM extraction
  └─► scripts/extraction_pipeline.py --llm <url> "<instruction>"

Simple markdown/docs?        → Basic crawl
  └─► scripts/basic_crawler.py <url>

Multiple URLs?               → Batch
  └─► scripts/batch_crawler.py urls.txt [--max-concurrent 5]
```

### Quick Patterns

```python
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig

# Basic markdown extraction
async with AsyncWebCrawler() as crawler:
    result = await crawler.arun("https://docs.example.com")
    # result.markdown → clean content
    # result.links["internal"] → discovered links

# Batch (concurrent)
results = await crawler.arun_many(urls, max_concurrent=5)

# Wait for dynamic content
config = CrawlerRunConfig(wait_for="css:.content", page_timeout=60000)

# Focus on specific selector
config = CrawlerRunConfig(
    css_selector=".main-content",
    excluded_tags=["nav", "footer"]
)
```

### Inject into Research Table

```markdown
| 3 | Schema for product pages | 5 | crawl4ai: schema.json | high |
| 4 | Docs for Clerk webhooks  | 4 | crawl4ai: clerk.com   | high |
```

### Troubleshooting

| Problem | Fix |
|---------|-----|
| JS not loading | Increase `page_timeout`, add `wait_for` |
| Bot detection | `headless=False`, add `asyncio.sleep()` delays |
| Hangs | Cancel, retry without `--wait`, check source list |

> Full SDK reference: `references/crawl4ai-sdk.md`
> Scripts: `scripts/basic_crawler.py`, `scripts/batch_crawler.py`, `scripts/extraction_pipeline.py`

---

## Phase 1B: NotebookLM Knowledge Synthesis — Optional

Use when research involves multi-source aggregation, persistent project memory, or post-implementation retrospectives.

### Prerequisites

```bash
which nlm && nlm doctor   # Verify before any NLM operation
# If auth expired: nlm login
```

**If either check fails:** Skip all NLM hooks. Log: "NotebookLM unavailable — skipping." Never block the main workflow.

### Notebook Strategy

- **Create a NEW notebook** per planning session
- **Reuse** only if the topic exactly matches a previous notebook
- Check: `nlm notebook list` → scan titles → create or reuse

### D.R.P.I.V Hooks

**Phase 0 — Bootstrap:**
```bash
nlm notebook list                                                        # Check for existing
nlm notebook create "Neondash - Feature Description"                     # Create if none matches
nlm alias set feature-slug <notebook-id>
nlm source add feature-slug --text "Requirements: ..." --title "Requirements" --wait
nlm source add feature-slug --file docs/existing-plan.md --wait          # If exists
```

**Phase 1 — Research Aggregation:**
```bash
nlm research start "query" --notebook-id <id> --mode deep
nlm research status <id> --max-wait 300
nlm research import <id> <task-id>
nlm source add <id> --url "https://..." --wait                           # Manual sources

# Extract synthesized findings
nlm notebook query <id> "Summarize key technical findings with sources"
nlm notebook query <id> "List all edge cases mentioned across sources"
nlm notebook query <id> "Extract security considerations"
```

**Phase 2 — Plan Validation:**
```bash
nlm source add <id> --file docs/PLAN-slug.md --title "Plan v1" --wait
nlm notebook query <id> "Does this plan address all findings? What's missing?"
nlm notebook query <id> "Identify risks not covered in the plan"
nlm notebook query <id> "Are there contradictions between plan and research?"
```

**Phase 3 — Decision Logging (during implementation):**
```bash
nlm source add <id> --text "Decision: Chose X over Y because..." --title "ADR" --wait
nlm source add <id> --text "Blocker: ..." --title "Implementation Note" --wait
```

**Phase 4 — Retrospective (after validation):**
```bash
nlm audio create <id> --format deep_dive --length long --confirm
nlm report create <id> --format "Briefing Doc" --confirm
nlm flashcards create <id> --difficulty medium --confirm
nlm studio status <id>   # Poll until ready
nlm download report <id> <artifact-id> --output docs/briefing.md
```

### Constraints

| Issue | Fix |
|-------|-----|
| CLI not installed | `uv tool install notebooklm-mcp-cli` |
| Auth expired | `nlm login` |
| Rate limit (~50/day) | Batch queries; fall back to Tavily |
| Source hangs | Cancel, retry without `--wait`, check `nlm source list` |
| Research returns nothing | Broader query, `--mode deep`, fall back to Tavily |
| Breaking API change | `uv tool upgrade notebooklm-mcp-cli` |

**Always use `--wait`** when adding sources — they aren't queryable until processed.
**Never reuse notebooks from unrelated topics.**

> Full CLI reference: `references/notebooklm-cli.md`
> Detailed per-phase hooks: `references/notebooklm-hooks.md`

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
| Use NLM without checking `which nlm` | Always verify CLI first |
| Not using `--wait` on NLM sources | Sources not queryable until processed |
| Schema-less scraping for repetitive data | Generate schema once, reuse |
| Block workflow on NLM/Crawl4AI failure | Always optional — degrade gracefully |

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

RESEARCH CASCADE:
1. Codebase (Grep/Glob/Read)
2. Tavily (web search)
3. Crawl4AI (live extraction)    ← optional, non-blocking
4. NotebookLM (synthesis/memory) ← optional, non-blocking
5. Sequential Thinking

GOLDEN RULES:
✓ DESIGN FIRST — present design, get approval
✓ RESEARCH ALWAYS — never implement blind
✓ BITE-SIZED STEPS — each = one action (2-5 min)
✓ EXACT CODE — complete code, never vague
✓ ONE QUESTION — never overwhelm
✓ 2-3 APPROACHES — always explore alternatives
✓ SELF-REVIEW — 5 criteria before presenting
✓ CONFIDENCE TAG — score every finding 1-5
✓ OPTIONAL TOOLS — NLM and Crawl4AI degrade gracefully
```

---

## References

- `references/01-discover.md` — Brainstorming protocol
- `references/02-plan.md` — Plan template
- `references/03-risk.md` — Pre-mortem + ADR (L6+)
- `references/notebooklm-cli.md` — Full `nlm` CLI command reference
- `references/notebooklm-hooks.md` — Detailed per-phase NLM workflow
- `references/crawl4ai-sdk.md` — Complete Crawl4AI SDK reference
- `scripts/basic_crawler.py` — Simple markdown extraction with screenshots
- `scripts/batch_crawler.py` — Multi-URL concurrent processing
- `scripts/extraction_pipeline.py` — Schema generation + CSS/LLM extraction
