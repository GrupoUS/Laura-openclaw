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
    debugger)
        echo '{"hookSpecificOutput":{"hookEventName":"SubagentStart","additionalContext":"Debug: systematic | check+test | logs in .claude/logs/"}}'
        ;;
    test-engineer)
        echo '{"hookSpecificOutput":{"hookEventName":"SubagentStart","additionalContext":"Test: *.test.ts | bun test | TDD"}}'
        ;;
    orchestrator)
        echo '{"hookSpecificOutput":{"hookEventName":"SubagentStart","additionalContext":"Orchestrate: TaskCreate/Update | coordinate team"}}'
        ;;
    *)
        exit 0
        ;;
esac

exit 0
