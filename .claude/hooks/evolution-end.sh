#!/bin/bash
# evolution-end.sh - Log session end
# Trigger: Stop

DIR="$CLAUDE_PROJECT_DIR/.claude/docs/evolution"
mkdir -p "$DIR"
echo "{\"time\":\"$(date -Iseconds)\",\"event\":\"session_end\"}" >> "$DIR/sessions.jsonl"

exit 0
