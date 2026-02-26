#!/bin/bash
# subagent-start.sh - Inject context when subagents start (optimized)
# Compressed output from ~200 chars to ~50 chars per agent

INPUT=$(timeout 0.2 cat || true)

# Extract agent info using grep (no python)
AGENT_TYPE=$(grep -oP '"agent_type"\s*:\s*"\K[^"]+' <<< "$INPUT" 2>/dev/null || echo "unknown")

# Inject compressed context based on agent type
case "$AGENT_TYPE" in
    backend-specialist)
        echo '{"hookSpecificOutput":{"hookEventName":"SubagentStart","additionalContext":"Bun | AGENTS.md | check before commit"}}'
        ;;
    frontend-specialist)
        echo '{"hookSpecificOutput":{"hookEventName":"SubagentStart","additionalContext":"Bun | semantic colors | AGENTS.md"}}'
        ;;
    database-architect)
        echo '{"hookSpecificOutput":{"hookEventName":"SubagentStart","additionalContext":"Schema+indexes+FK safety | drizzle conventions"}}'
        ;;
    debugger)
        echo '{"hookSpecificOutput":{"hookEventName":"SubagentStart","additionalContext":"Debug: systematic | check+test | logs in .claude/logs/"}}'
        ;;
    performance-optimizer)
        echo '{"hookSpecificOutput":{"hookEventName":"SubagentStart","additionalContext":"Perf/Sec/SEO: measure-first | OWASP+CWV+meta"}}'
        ;;
    explorer-agent)
        echo '{"hookSpecificOutput":{"hookEventName":"SubagentStart","additionalContext":"Explore broadly | return paths+evidence only"}}'
        ;;
    project-planner)
        echo '{"hookSpecificOutput":{"hookEventName":"SubagentStart","additionalContext":"D.R.P.I.V plan | atomic tasks | dependencies"}}'
        ;;
    mobile-developer)
        echo '{"hookSpecificOutput":{"hookEventName":"SubagentStart","additionalContext":"Mobile-first flows | touch+performance+offline"}}'
        ;;
    oracle)
        echo '{"hookSpecificOutput":{"hookEventName":"SubagentStart","additionalContext":"Read-only consultant | analysis only | no edits"}}'
        ;;
    orchestrator)
        echo '{"hookSpecificOutput":{"hookEventName":"SubagentStart","additionalContext":"Orchestrate: classify → delegate → verify → close"}}'
        ;;
    *)
        exit 0
        ;;
esac

exit 0
