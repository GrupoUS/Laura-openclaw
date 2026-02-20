#!/bin/bash
# smart-bash-approver.sh - Autonomia seletiva para comandos Bash
# Receives JSON via stdin, outputs JSON decision

INPUT=$(timeout 0.2 cat || true)

# Extract command using grep (no python)
COMMAND=$(grep -oP '"command"\s*:\s*"\K[^"]+' <<< "$INPUT" | head -1 2>/dev/null)

# === SAFE DELETION PATTERNS - Auto-allow node_modules cleanup (must check FIRST) ===
SAFE_DELETE_PATTERNS=(
  "node_modules"
  "/node_modules"
  "\\.cache"
  "/\\.turbo"
)

for pattern in "${SAFE_DELETE_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern" 2>/dev/null; then
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
    exit 0
  fi
done

# === DANGEROUS PATTERNS - Always block ===
DANGEROUS_PATTERNS=(
  "^rm -rf /"
  "^rm -rf ~"
  "^rm -rf \$HOME"
  "^:(){ :|:& };:"
  "^chmod -R 777 /"
  "^dd if=.*of=/dev/"
  "^> /dev/sd"
  "^DROP DATABASE"
  "^DROP TABLE"
  "^TRUNCATE"
  "^git push --force.*main"
  "^git push --force.*master"
  "^git reset --hard HEAD~"
  "^sudo rm"
  "^truncate -s 0"
  "^> /etc/"
  "^mkfs"
  "^dd if=/dev/zero"
  "^git push -f.*main"
  "^git push -f.*master"
  "rm --no-preserve-root"
  "chmod -R 000"
)

# === CLEANUP PATTERNS - Ask for approval (safe deletions) ===
CLEANUP_PATTERNS=(
  "\\.turbo/.*\\.log"
  "\\.old_modules"
  "\\.sisyphus/.*\\.log"
  "node_modules/\\.cache"
  "\\.turbo$"
  "__pycache__"
  "\\.next/cache"
  "dist/.*\\.log"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern" 2>/dev/null; then
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"BLOCKED: Dangerous command pattern detected"}}'
    exit 0
  fi
done

# Check cleanup patterns - ask for approval
for pattern in "${CLEANUP_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern" 2>/dev/null; then
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"Cleanup operation - requires user approval"}}'
    exit 0
  fi
done

# === SAFE PATTERNS - Auto-approve ===
# Git commands (read and safe operations)
SAFE_PATTERNS=(
  "^git status"
  "^git diff"
  "^git log"
  "^git branch"
  "^git fetch"
  "^git show"
  "^git stash"
  "^git stash list"
  "^git remote -v"
  "^git remote show"
  "^git reflog"
  "^git rev-parse"
  "^git status --porcelain"
  "^git diff --cached"
  "^git blame"
  "^git grep"
  "^gitk"
  "^git gui"
  "^hub pr checkout"
  "^gh pr view"
  "^gh pr list"
  "^gh run view"
  "^gh run list"
  "^gh issue view"
  "^gh issue list"
)

# File system read commands
SAFE_PATTERNS+=(
  "^ls"
  "^cat "
  "^head "
  "^tail "
  "^grep "
  "^rg "
  "^find "
  "^which "
  "^pwd"
  "^echo "
  "^tree "
  "^stat "
  "^wc -"
  "^cut "
  "^sort "
  "^uniq "
  "^column -t"
  "^less "
  "^more "
)

# Development commands - bun
SAFE_PATTERNS+=(
  "^bun test"
  "^bun run check"
  "^bun run lint"
  "^bun run lint:check"
  "^bun install"
  "^bun x "
  "^bun run build"
  "^bun dev"
  "^bun start"
  "^bun run db:"
  "^bun run db:push"
  "^bun run db:studio"
  "^bun run db:generate"
  "^bun run db:migrate"
  "^bun run db:seed"
  "^bun run tsc"
  "^bun run typecheck"
  "^bun run"
  "^bun -"
  "^bunx tsc"
  "^bunx ultracite"
  "^bunx oxlint"
  "^bunx @biomejs/biome"
  "^bunx biome"
)

# Development commands - npm/yarn/pnpm
SAFE_PATTERNS+=(
  "^npm test"
  "^npm run lint"
  "^npm run build"
  "^npm run dev"
  "^npm start"
  "^npm i "
  "^npm install"
  "^npx "
  "^yarn "
  "^pnpm "
)

# Development commands - general
SAFE_PATTERNS+=(
  "^python3 --version"
  "^node --version"
  "^bun --version"
  "^npm --version"
  "^yarn --version"
  "^npx --version"
  "^pnpm --version"
  "^docker --version"
  "^docker-compose --version"
  "^psql --version"
  "^git --version"
  "^curl --version"
  "^wget --version"
  "^code --version"
)

# File operations (safe ones)
SAFE_PATTERNS+=(
  "^mkdir -p"
  "^touch "
  "^cp -r "
  "^cp "
  "^mv "
  "^chmod +x"
  "^chmod 755"
  "^chmod 644"
  "^chown "
  "^rsync"
)

# Process commands (read only)
SAFE_PATTERNS+=(
  "^ps aux"
  "^ps -ef"
  "^top -"
  "^htop"
  "^free -"
  "^df -h"
  "^du -sh"
  "^uptime"
  "^whoami"
  "^id"
)

# Network commands (read only)
SAFE_PATTERNS+=(
  "^curl -"
  "^wget -"
  "^ping -"
  "^ssh -V"
  "^nc -zv"
  "^telnet"
)

# Build and lint tools
SAFE_PATTERNS+=(
  "^biome"
  "^eslint"
  "^prettier"
  "^tsc --"
  "^typescript --version"
  "^vite --version"
  "^next --version"
  "^turbo --version"
  "^rollup"
  "^webpack"
)

# Test coverage and debugging
SAFE_PATTERNS+=(
  "^bun test --coverage"
  "^jest --coverage"
  "^vitest --coverage"
  "^npx vitest"
  "^npx jest"
  "^npx playwright test"
  "^playwright test"
)

# App running commands (dev servers)
SAFE_PATTERNS+=(
  "^bun run preview"
  "^npm run serve"
  "^node server"
  "^node index"
  "^npm start"
  "^yarn start"
)

for pattern in "${SAFE_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern" 2>/dev/null; then
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
    exit 0
  fi
done

# === SEMI-SAFE: Allow with some caution ===
# Commands that are generally safe but might need review
SEMI_SAFE_PATTERNS=(
  "^git add"
  "^git commit"
  "^git checkout"
  "^git switch"
  "^git restore"
  "^git clean"
  "^git rebase"
  "^git merge"
  "^git pull"
  "^git push"
  "^gh pr create"
  "^gh pr merge"
  "^gh pr approve"
  "^gh issue create"
)

for pattern in "${SEMI_SAFE_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern" 2>/dev/null; then
    # Allow git operations that don't force-push or reset hard
    if echo "$COMMAND" | grep -qE "(push --force|reset --hard|--hard:main|--hard:master|-f main|-f master)" 2>/dev/null; then
      echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"BLOCKED: Force push or hard reset detected"}}'
      exit 0
    fi
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
    exit 0
  fi
done

# === DEFAULT: Allow most bun/npm commands ===
# Allow common development commands automatically
if echo "$COMMAND" | grep -qE "^(bun|npm|yarn|pnpm|npx|bunx) " 2>/dev/null; then
  # Block dangerous subcommands
  if echo "$COMMAND" | grep -qE "(rm -rf|uninstall.*--all|cache clean|publish.*--force)" 2>/dev/null; then
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"BLOCKED: Dangerous package manager command"}}'
    exit 0
  fi
  # Allow everything else
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'
  exit 0
fi

# === UNKNOWN: Ask user ===
echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask"}}'
