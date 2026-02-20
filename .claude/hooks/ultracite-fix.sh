#!/bin/bash
# PostToolUse hook to run Biome format + OXLint fix on edited/written files
# Architecture: Biome = formatter only | OXLint = linter (auto-fix)
# Receives JSON input via stdin with tool_input.file_path

INPUT=$(timeout 0.2 cat || true)

# Extract file path using grep (no python)
FILE_PATH=$(grep -oP '"file_path"\s*:\s*"\K[^"]+' <<< "$INPUT" 2>/dev/null)

# Skip if no file path
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only fix TypeScript/JavaScript/JSON files
if [[ "$FILE_PATH" == *.ts || "$FILE_PATH" == *.tsx || "$FILE_PATH" == *.js || "$FILE_PATH" == *.jsx || "$FILE_PATH" == *.json ]]; then
  # Step 1: Biome formats the file (formatter-only, fast)
  bunx biome check "$FILE_PATH" --write 2>&1

  # Step 2: OXLint fixes lint issues (auto-fixable only, for non-JSON)
  if [[ "$FILE_PATH" != *.json ]]; then
    bunx oxlint "$FILE_PATH" --fix --fix-suggestions 2>&1
  fi
fi

exit 0
