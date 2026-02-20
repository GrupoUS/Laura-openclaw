#!/bin/bash
# ============================================================
# OpenClaw Daily Maintenance Script
# Runs daily at 06:00 (America/Sao_Paulo) via crontab
# ============================================================

set -euo pipefail

LOG_DIR="/home/mauricio/openclaw/logs"
LOG_FILE="${LOG_DIR}/maintenance-$(date +%Y-%m-%d).log"
OPENCLAW="/home/linuxbrew/.linuxbrew/bin/openclaw"

mkdir -p "$LOG_DIR"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "🦞 OpenClaw Daily Maintenance – START"
log "=========================================="

# ── 1. Update OpenClaw to latest stable ──────────────────────
log "📦 Step 1: Updating OpenClaw..."
if npm install -g openclaw@latest >> "$LOG_FILE" 2>&1; then
  NEW_VER=$($OPENCLAW --version 2>/dev/null || echo "unknown")
  log "✅ Updated to version: ${NEW_VER}"
else
  log "⚠️  Update failed — continuing with current version"
fi

# ── 2. Run openclaw doctor (diagnostic) ─────────────────────
log "🩺 Step 2: Running openclaw doctor..."
$OPENCLAW doctor >> "$LOG_FILE" 2>&1 || log "⚠️  Doctor reported issues"

# ── 3. Run openclaw doctor --fix (auto-repair) ──────────────
log "🔧 Step 3: Running openclaw doctor --fix..."
$OPENCLAW doctor --fix >> "$LOG_FILE" 2>&1 || log "⚠️  Doctor --fix reported issues"

# ── 4. Restart the gateway ───────────────────────────────────
log "🔄 Step 4: Restarting gateway..."
if $OPENCLAW gateway restart >> "$LOG_FILE" 2>&1; then
  log "✅ Gateway restarted successfully"
else
  log "⚠️  Gateway restart failed — attempting stop+start..."
  $OPENCLAW gateway stop >> "$LOG_FILE" 2>&1 || true
  sleep 2
  $OPENCLAW gateway start >> "$LOG_FILE" 2>&1 || log "❌ Gateway start failed"
fi

# ── 5. Cleanup old maintenance logs (keep 30 days) ──────────
log "🧹 Step 5: Cleaning old logs..."
find "$LOG_DIR" -name 'maintenance-*.log' -mtime +30 -delete 2>/dev/null || true

log "=========================================="
log "🦞 OpenClaw Daily Maintenance – DONE"
log "=========================================="
