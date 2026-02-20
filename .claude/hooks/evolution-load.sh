#!/bin/bash
# evolution-load.sh - Context injection on session start
# Trigger: SessionStart

INPUT=$(timeout 0.2 cat || true)
SOURCE=$(grep -oP '"source"\s*:\s*"\K[^"]+' <<< "$INPUT" 2>/dev/null || echo "")

if [ "$SOURCE" = "startup" ]; then
    ERRORS_FILE="$CLAUDE_PROJECT_DIR/.claude/docs/evolution/errors.jsonl"
    if [ -f "$ERRORS_FILE" ]; then
        RECENT=$(tail -50 "$ERRORS_FILE" 2>/dev/null | grep -c "time" || echo "0")
        [ "$RECENT" -gt 0 ] && echo "📝 $RECENT erros recentes capturados"
    fi
fi

exit 0
