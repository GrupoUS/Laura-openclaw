#!/bin/bash
# evolution-error.sh - Capture tool failures
# Trigger: PostToolUseFailure

INPUT=$(timeout 0.2 cat || true)
TOOL=$(grep -oP '"tool_name"\s*:\s*"\K[^"]+' <<< "$INPUT" 2>/dev/null || echo "unknown")

# Only capture from relevant tools
if [ "$TOOL" = "Bash" ] || [ "$TOOL" = "Edit" ] || [ "$TOOL" = "Write" ]; then
    ERROR=$(grep -oP '"error"\s*:\s*"\K[^"]+' <<< "$INPUT" 2>/dev/null | head -c 200 || echo "")
    DIR="$CLAUDE_PROJECT_DIR/.claude/docs/evolution"
    mkdir -p "$DIR"
    echo "{\"time\":\"$(date -Iseconds)\",\"tool\":\"$TOOL\",\"error\":\"$ERROR\"}" >> "$DIR/errors.jsonl"
fi

exit 0
