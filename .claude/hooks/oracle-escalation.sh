#!/bin/bash

INPUT=$(timeout 0.3 cat || true)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-/home/mauricio/neondash}"
LOG_DIR="$PROJECT_DIR/.claude/logs"
COUNTER_FILE="$LOG_DIR/oracle-failure-count.txt"
LOG_FILE="$LOG_DIR/oracle-escalation.jsonl"
mkdir -p "$LOG_DIR"

AGENT_TYPE=$(grep -oP '"agent_type"\s*:\s*"\K[^"]+' <<< "$INPUT" 2>/dev/null || echo "unknown")
TRANSCRIPT_PATH=$(grep -oP '"agent_transcript_path"\s*:\s*"\K[^"]+' <<< "$INPUT" 2>/dev/null || echo "")

case "$AGENT_TYPE" in
  orchestrator|debugger|backend-specialist|frontend-specialist|database-architect|performance-optimizer)
    ;;
  *)
    exit 0
    ;;
esac

FAIL_SIGNAL="0"
if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
  if grep -Eiq "\b(fail|failed|error|exception|traceback|panic)\b" "$TRANSCRIPT_PATH"; then
    FAIL_SIGNAL="1"
  fi
fi

if [ "$FAIL_SIGNAL" != "1" ]; then
  exit 0
fi

COUNT=$(cat "$COUNTER_FILE" 2>/dev/null || echo "0")
COUNT=$((COUNT + 1))
echo "$COUNT" > "$COUNTER_FILE"

TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
printf '{"timestamp":"%s","agent":"%s","count":%s}\n' "$TS" "$AGENT_TYPE" "$COUNT" >> "$LOG_FILE"

if [ "$COUNT" -ge 2 ]; then
  echo "ORACLE ESCALATION: repeated failure signals detected ($COUNT)." >&2
  echo "Action: delegate read-only analysis to oracle, then resume implementation with evidence." >&2
  echo "0" > "$COUNTER_FILE"
fi

exit 0
