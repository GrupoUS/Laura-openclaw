#!/bin/bash
# subagent-log.sh - Log subagent completion for observability (optimized)
# Uses grep instead of python3 for JSON parsing

INPUT=$(timeout 0.2 cat || true)

# Extract all relevant fields using grep (no python)
AGENT_TYPE=$(grep -oP '"agent_type"\s*:\s*"\K[^"]+' <<< "$INPUT" 2>/dev/null || echo "unknown")
AGENT_ID=$(grep -oP '"agent_id"\s*:\s*"\K[^"]+' <<< "$INPUT" 2>/dev/null || echo "unknown")
SESSION_ID=$(grep -oP '"session_id"\s*:\s*"\K[^"]+' <<< "$INPUT" 2>/dev/null || echo "unknown")
TRANSCRIPT_PATH=$(grep -oP '"agent_transcript_path"\s*:\s*"\K[^"]+' <<< "$INPUT" 2>/dev/null || echo "")

# Filter: Skip agents that are just quick lookups
SKIP_TYPES="Explore|general-purpose|Bash"
if echo "$AGENT_TYPE" | grep -qE "$SKIP_TYPES" 2>/dev/null; then
    exit 0
fi

# Get transcript file size as proxy for task complexity
TRANSCRIPT_LINES="0"
if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
    TRANSCRIPT_LINES=$(wc -l < "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")
    # Skip if transcript is very small (quick lookup)
    if [ "$TRANSCRIPT_LINES" -lt 20 ] 2>/dev/null; then
        exit 0
    fi
fi

# Determine project directory
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-/home/mauricio/neondash}"
LOG_DIR="${PROJECT_DIR}/.claude/logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Build log entry directly as JSON (no python)
cat <<EOF >> "$LOG_DIR/subagent-events.jsonl"
{"timestamp":"$TIMESTAMP","session_id":"$SESSION_ID","agent_id":"$AGENT_ID","agent_type":"$AGENT_TYPE","transcript_lines":$TRANSCRIPT_LINES}
EOF

exit 0
