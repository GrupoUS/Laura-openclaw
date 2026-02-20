#!/bin/bash
# Stop hook to run OXLint check before Claude stops
# Only blocks on critical errors (not style warnings) in modified files
# Architecture: Biome = formatter only | OXLint = linter (fast, Rust-native)

# Early exit if already in stop hook loop to prevent infinite recursion
INPUT=$(timeout 0.2 cat || true)
if grep -q '"stop_hook_active"\s*:\s*true' <<< "$INPUT" 2>/dev/null; then
  exit 0
fi

# Get list of modified TypeScript/JavaScript files (exclude JSON - usually config)
MODIFIED_FILES=$(git diff --name-only --diff-filter=ACM 2>/dev/null | grep -E '\.(ts|tsx|js|jsx)$' | head -20)

# If no modified files, allow stopping
if [ -z "$MODIFIED_FILES" ]; then
  exit 0
fi

# Run OXLint only on modified files (much faster than ultracite)
FILES_ARGS=$(echo "$MODIFIED_FILES" | tr '\n' ' ')

if [ -z "$FILES_ARGS" ]; then
  exit 0
fi

RAW_OUTPUT=$(bunx oxlint $FILES_ARGS 2>&1)
OXLINT_EXIT=$?

# Only block on errors, not warnings
# OXLint outputs "Found X warnings and Y errors" at the end
ERROR_COUNT=$(echo "$RAW_OUTPUT" | grep -oP '\d+ error' | grep -oP '\d+' | head -1)

if [ -n "$ERROR_COUNT" ] && [ "$ERROR_COUNT" -gt 0 ]; then
  # Truncate output if too long
  TRUNCATED=$(echo "$RAW_OUTPUT" | tail -30 | head -c 2000)
  echo "{\"decision\":\"block\",\"reason\":\"OXLint found $ERROR_COUNT error(s). Fix them before stopping:\\n\\n$TRUNCATED\"}"
  exit 0
fi

# No critical errors, allow Claude to stop
exit 0
