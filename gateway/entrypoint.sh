#!/bin/bash
set -e

# If OPENCLAW_CONFIG_B64 is set, decode it to openclaw.json
if [ -n "$OPENCLAW_CONFIG_B64" ]; then
  echo "$OPENCLAW_CONFIG_B64" | base64 -d > /app/openclaw.json
  echo "[gateway] Config decoded from OPENCLAW_CONFIG_B64"
fi

# Ensure config exists
if [ ! -f /app/openclaw.json ]; then
  echo "[gateway] ERROR: No openclaw.json found. Set OPENCLAW_CONFIG_B64 env var."
  exit 1
fi

export OPENCLAW_CONFIG_PATH=/app/openclaw.json
export OPENCLAW_STATE_DIR=/app/state

mkdir -p "$OPENCLAW_STATE_DIR"

# Start gateway with Railway-friendly settings
exec openclaw gateway \
  --port "${PORT:-3333}" \
  --bind lan \
  --allow-unconfigured \
  --token "${OPENCLAW_GATEWAY_TOKEN:-}" \
  --ws-log compact
