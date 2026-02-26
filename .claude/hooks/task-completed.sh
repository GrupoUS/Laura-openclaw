#!/bin/bash
# task-completed.sh - Log task completion (optimized: grep instead of python3)
# Trigger: TaskCompleted

INPUT=$(timeout 0.2 cat || true)

TASK_ID=$(grep -oP '"task_id"\s*:\s*"\K[^"]+' <<< "$INPUT" 2>/dev/null || echo "unknown")
TASK_SUBJECT=$(grep -oP '"task_subject"\s*:\s*"\K[^"]+' <<< "$INPUT" 2>/dev/null || echo "unknown")
TEAMMATE_NAME=$(grep -oP '"teammate_name"\s*:\s*"\K[^"]+' <<< "$INPUT" 2>/dev/null || echo "")

if [ -n "$TEAMMATE_NAME" ]; then
    PROJECT_DIR="${CLAUDE_PROJECT_DIR:-/home/mauricio/neondash}"
    LOG_DIR="${PROJECT_DIR}/.claude/logs"
    mkdir -p "$LOG_DIR"
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "{\"timestamp\":\"$TIMESTAMP\",\"event\":\"task_completed\",\"teammate\":\"$TEAMMATE_NAME\",\"task_id\":\"$TASK_ID\",\"subject\":\"$TASK_SUBJECT\"}" >> "$LOG_DIR/team-events.jsonl"
fi

exit 0
