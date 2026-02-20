#!/bin/bash
# protect-files.sh - Bloqueia modificações em arquivos sensíveis
# Exit 2 = block with stderr feedback

INPUT=$(timeout 0.2 cat || true)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Protected patterns
PROTECTED_PATTERNS=(
  ".env"
  ".env.local"
  ".env.production"
  ".env.development"
  "credentials"
  "secrets"
  "api-keys"
  ".git/"
  ".git\\"
  "package-lock.json"
  "bun.lockb"
  "yarn.lock"
  "pnpm-lock.yaml"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "BLOCKED: '$FILE_PATH' matches protected pattern '$pattern'" >&2
    exit 2
  fi
done

exit 0
