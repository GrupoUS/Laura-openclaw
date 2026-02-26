---
description: Deep research mode - parallel exploration of codebase and external docs. Returns structured findings only, no code changes.
---

# /research - Parallel Research Only

**ARGUMENTS**:$ARGUMENTS

<command-instruction>
Trigger Phase 2A of the orchestrator protocol in RESEARCH-ONLY mode.

## Agent Routing (MANDATORY — choose based on WHERE the answer lives)

| Question Type                        | Agent      | Why                        |
| ------------------------------------ | ---------- | -------------------------- |
| What exists in our codebase?         | `explorer` | Answer lives in filesystem |
| How does this code pattern work?     | `explorer` | Answer lives in filesystem |
| Which files need to change?          | `explorer` | Answer lives in filesystem |
| How does this library/API work?      | `librarian` | Answer lives externally   |
| What are the best practices for X?   | `librarian` | Answer lives externally   |
| Is this package behavior documented? | `librarian` | Answer lives externally   |

## Execution

1. Fire `explorer` in background for codebase structure analysis
2. Fire `librarian` in background for external documentation **IF** any library, package, or external API is mentioned
3. Continue reading immediately — do not wait
4. Collect background results
5. Output structured findings table with Confidence (1-5), Source, Impact
6. Do NOT implement. Research only.

## Findings Format

| #   | Finding | Confidence | Source              | Impact |
| --- | ------- | ---------- | ------------------- | ------ |
| 1   | ...     | 4          | codebase: path/file | high   |
| 2   | ...     | 5          | docs: URL           | high   |

## Knowledge Gaps

[List what remains unknown after both agents complete]

## Recommended Next Step

[One suggested action based on findings]
</command-instruction>
