---
name: capability-evolver
description: "Master self-evolution engine for OpenClaw agents."
metadata: {"openclaw":{"emoji":"🧬"}}
---

# 🧬 Capability Evolver (Master Evolution Skill)

## Overview

> Master self-evolution engine for OpenClaw agents. Combines Ascension Protocol with Compound Engineering for continuous learning and improvement.


**"I don't just run code. I write it. And I learn from everything."**

The **Capability Evolver** is a meta-skill that allows OpenClaw agents to inspect their own runtime history, identify failures or inefficiencies, and autonomously write new code or update their own memory to improve performance.

Now featuring **Ascension Protocol (v2.0)** combined with **Compound Engineering** for systematic knowledge accumulation.

---

## ✨ Core Architecture

| Layer | Purpose | Mechanism |
|-------|---------|-----------|
| **Ascension Protocol** | Immediate self-improvement | Scan → Fix → Crystallize → Persist |
| **Compound Loop** | Systematic learning | Daily Work → Nightly Review → Next Day Benefits |
| **Knowledge Crystallization** | Permanent storage | LESSONS_LEARNED.md, ACTIVE_MUTATIONS.md |
| **Safety Protocols** | Stability control | ADL (Anti-Degeneration Lock) + VFM (Value Function) |

---

## ✨ Features

- **🔍 Auto-Log Analysis**: Automatically scans memory and history files for errors and patterns.
- **🛠️ Self-Repair**: Detects crashes and suggests patches.
- **💎 Knowledge Crystallization**: Extracts lessons into `memory/KNOWLEDGE_BASE/LESSONS_LEARNED.md`.
- **🥚 Skill Incubation**: Can spontaneously generate new skills in `skills/`.
- **🐕 Mad Dog Mode**: Continuous self-healing loop (`--loop`).
- **📊 Compound Learning**: Systematic daily review and knowledge accumulation.

---

## 📦 Usage

### Manual Trigger
```bash
node skills/capability-evolver/index.js
```

### 🐕 Mad Dog Mode (Continuous)
Runs the evolver in an infinite loop (Agent-Driven).
```bash
node skills/capability-evolver/index.js --loop
```
*Stop with `kill -9 <pid>`.*

---

## 🧠 Ascension Protocol (Immediate Evolution)

### Phase 1: INTROSPECT (Scan)
- Look for errors in the transcript
- Look for "User Corrections" (e.g., "No, do it this way")

### Phase 2: EVOLVE (Act)
- **Fix**: If error found → Edit code to fix it
- **Optimize**: If code is slow/verbose → Refactor it
- **Crystallize (Knowledge Ascension)**:
  - If you learned a new rule (e.g., "Always use WebP"), **DO NOT** just remember it
  - **WRITE IT DOWN**: Append it to `memory/KNOWLEDGE_BASE/LESSONS_LEARNED.md`
  - **PROMOTE IT**: If it's a critical rule, update `AGENTS.md` or `TOOLS.md`

### Phase 3: PERSIST
- Save changes locally
- **Safe Publish**: If you modified a skill, run `node skills/capability-evolver/safe_publish.js skills/<name>`
- **Git**: Sync workspace changes

---

## 🔄 Compound Loop (Systematic Learning)

The idea: Your agent reviews its own work, extracts patterns and lessons, and updates its instructions. Tomorrow's agent is smarter than today's.

```
┌─────────────────────────────────────────┐
│           DAILY WORK                    │
│  Sessions, chats, tasks, decisions      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│        NIGHTLY REVIEW                   │
│  • Scan all sessions from last 24h      │
│  • Extract learnings and patterns       │
│  • Update MEMORY.md and AGENTS.md       │
│  • Commit and push changes              │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│        NEXT DAY                         │
│  Agent reads updated instructions       │
│  Benefits from yesterday's learnings    │
└─────────────────────────────────────────┘
```

### What Gets Extracted

- **Patterns**: Recurring approaches that worked
- **Gotchas**: Things that failed or caused issues
- **Preferences**: User preferences discovered
- **Decisions**: Key decisions and their reasoning
- **TODOs**: Unfinished items to remember

---

## 📁 Memory File Structure

### MEMORY.md (Long-term)
```markdown
# Long-Term Memory

## Patterns That Work
- When doing X, always Y first
- User prefers Z approach for...

## Gotchas to Avoid
- Don't do X without checking Y
- API Z has rate limit of...

## User Preferences
- Prefers concise responses
- Timezone: PST
```

### memory/YYYY-MM-DD.md (Daily)
```markdown
# 2026-01-28 (Tuesday)

## Sessions
- 09:00 - Built security audit tool
- 14:00 - Published 40 skills

## Decisions
- Chose to batch publish in parallel

## Learnings
- ClawdHub publish can timeout, retry with new version

## Open Items
- [ ] Finish remaining uploads
- [ ] Set up analytics tracker
```

### memory/KNOWLEDGE_BASE/ (Crystallized Wisdom)
- `LESSONS_LEARNED.md` - Permanent learnings
- `ACTIVE_MUTATIONS.md` - Current experiments

---

## ⏰ Cron Integration

### Nightly Review Job

Add to OpenClaw cron:
```json
{
  "id": "compound-nightly",
  "schedule": "30 22 * * *",
  "text": "Review all sessions from the last 24 hours. For each session, extract: 1) Key learnings and patterns, 2) Mistakes or gotchas to avoid, 3) User preferences discovered, 4) Unfinished items. Update MEMORY.md with a summary. Update memory/YYYY-MM-DD.md with details. Commit changes to git."
}
```

### Manual Review Command

```
Review the last 24 hours of work. Extract:

1. **Patterns that worked** - approaches to repeat
2. **Gotchas encountered** - things to avoid
3. **Preferences learned** - user likes/dislikes
4. **Key decisions** - and their reasoning
5. **Open items** - unfinished work

Update:
- MEMORY.md with significant long-term learnings
- memory/YYYY-MM-DD.md with today's details
- AGENTS.md if workflow changes needed

Commit changes with message "compound: daily review YYYY-MM-DD"
```

---

## 🛡️ Safety & Risk Protocol (MANDATORY)

### Risk Assessment & Mitigation

| Risk | Level | Mitigation Strategy |
| :--- | :--- | :--- |
| **Infinite Recursion** | High | **Strict Single Process**: `evolve.js` MUST NOT spawn child evolution processes. The loop is handled safely in `index.js`. |
| **Runaway Process** | High | **Kill Switch**: Use `kill -9 <pid>` to terminate the Mad Dog loop if it becomes unresponsive. |
| **Hallucinated Fixes** | Medium | **Human Review (Optional)**: "Fixing non-broken code" is a risk. Mitigation: Periodic human audit of changes. |
| **File Corruption** | High | **Git Sync**: Always keep `workspace_daily_sync` (or `git-sync`) active to backup the workspace before/after evolution. |

### Related Protocols

- **ADL.md**: Anti-Degeneration Lock Protocol - Stability > Novelty
- **VFM.md**: Value Function Mutation Protocol - Capability scoring criteria
- **TREE.md**: Capability Tree structure

---

## 📊 The Compound Effect

| Time | State |
|------|-------|
| **Week 1** | Agent knows basics |
| **Week 2** | Agent remembers your preferences |
| **Week 4** | Agent anticipates your needs |
| **Month 2** | Agent is an expert in your workflow |

Knowledge compounds. Every session makes future sessions better.

---

## 💡 Best Practices

1. **Review before sleep** - Let the nightly job run when you're done for the day
2. **Don't over-extract** - Focus on significant learnings, not noise
3. **Prune regularly** - Remove outdated info from MEMORY.md monthly
4. **Git everything** - Memory files should be version controlled
5. **Trust the compound** - Effects are subtle at first, dramatic over time

---

## 📜 License
MIT
