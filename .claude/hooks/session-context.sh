#!/bin/bash
# session-context.sh - Session context injection (optimized, compressed)
# Reduced from ~400 chars to ~80 chars output

# Get source to differentiate startup vs resume vs compact
INPUT=$(timeout 0.2 cat || true)
SOURCE=$(grep -oP '"source"\s*:\s*"\K[^"]+' <<< "$INPUT" 2>/dev/null || echo "")

# Fast git info
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

if [ "$SOURCE" = "startup" ]; then
    # Compressed output (~80 chars vs ~400 before)
    echo "[NEONDASH] Bun | branch:$BRANCH | gates: check+lint+test | db:push"
elif [ "$SOURCE" = "compact" ]; then
    # After compaction, brief reminder
    echo "[NEONDASH] Bun, check, lint:check, test, db:push"
fi
# resume: no output needed - context already present
