#!/bin/bash
# task-completed.sh - Verify task completion criteria
# Based on Claude Code official hooks documentation

INPUT=$(timeout 0.2 cat || true)

TASK_ID=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('task_id','unknown'))" 2>/dev/null)
TASK_SUBJECT=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('task_subject','unknown'))" 2>/dev/null)
TEAMMATE_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('teammate_name',''))" 2>/dev/null)

# If it's a teammate completing a task, add to log
if [ -n "$TEAMMATE_NAME" ]; then
    PROJECT_DIR="${CLAUDE_PROJECT_DIR:-/home/mauricio/neondash}"
    LOG_DIR="${PROJECT_DIR}/.claude/logs"
    mkdir -p "$LOG_DIR"

    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    LOG_ENTRY="{\"timestamp\": \"$TIMESTAMP\", \"event\": \"task_completed\", \"teammate\": \"$TEAMMATE_NAME\", \"task_id\": \"$TASK_ID\", \"subject\": \"$TASK_SUBJECT\"}"
    echo "$LOG_ENTRY" >> "$LOG_DIR/team-events.jsonl"
fi

# Exit 0 to allow completion
# Use exit 2 to block if criteria not met
exit 0
