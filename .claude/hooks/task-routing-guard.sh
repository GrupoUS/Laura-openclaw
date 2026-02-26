#!/bin/bash

INPUT=$(timeout 0.3 cat || true)

if [ -z "$INPUT" ]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
  exit 0
fi

SUBAGENT=$(echo "$INPUT" | python3 -c 'import json,sys; d=json.load(sys.stdin); print((d.get("tool_input") or {}).get("subagent_type") or "")' 2>/dev/null)
CATEGORY=$(echo "$INPUT" | python3 -c 'import json,sys; d=json.load(sys.stdin); print((d.get("tool_input") or {}).get("category") or "")' 2>/dev/null)

if [ -n "$SUBAGENT" ]; then
  case "$SUBAGENT" in
    backend-specialist|database-architect|debugger|documentation-writer|explorer-agent|frontend-specialist|mobile-developer|oracle|orchestrator|performance-optimizer|project-planner|explore|librarian|metis|momus|general-purpose|Explore|Plan|claude-code-guide|statusline-setup)
      ;;
    *)
      echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Unknown or unavailable subagent_type for this project."}}'
      exit 0
      ;;
  esac
fi

if [ -z "$SUBAGENT" ] && [ -z "$CATEGORY" ]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Task requires category or subagent_type."}}'
  exit 0
fi

# Note: run_in_background validation is now handled by plan.md
# This hook only validates that subagent_type is known

echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
exit 0
