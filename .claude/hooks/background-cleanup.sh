#!/bin/bash
# background-cleanup.sh - Log Stop events (silent, no context noise)
# Trigger: Stop

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(dirname "$(dirname "$(dirname "$0")")")}"
LOG_DIR="$PROJECT_DIR/.claude/logs"
mkdir -p "$LOG_DIR"

TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "[$TS] Session stopped." >> "$LOG_DIR/background-cleanup.log"

exit 0
