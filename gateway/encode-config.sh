#!/bin/bash
# Encode openclaw.json as base64 for Railway env var OPENCLAW_CONFIG_B64
# Usage: ./encode-config.sh [path-to-openclaw.json]

CONFIG_PATH="${1:-$HOME/.openclaw/openclaw.json}"

if [ ! -f "$CONFIG_PATH" ]; then
  echo "Error: $CONFIG_PATH not found"
  exit 1
fi

# Patch config for Railway deployment:
# - bind: "0.0.0.0" (accept connections from any container)
# - trustedProxies: include Railway CIDR ranges
node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('$CONFIG_PATH', 'utf8'));

// Patch gateway for Railway
config.gateway.bind = 'lan';
config.gateway.mode = 'local';
config.gateway.controlUi = config.gateway.controlUi || {};
config.gateway.controlUi.enabled = true;
config.gateway.controlUi.allowedOrigins = ['*'];

// Add Railway private network CIDRs to trustedProxies
const railwayCidrs = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
config.gateway.trustedProxies = [...new Set([
  ...(config.gateway.trustedProxies || []),
  ...railwayCidrs,
])];

const patched = JSON.stringify(config);
const b64 = Buffer.from(patched).toString('base64');
console.log(b64);
" 2>&1

echo ""
echo "---"
echo "Set this as OPENCLAW_CONFIG_B64 in Railway gateway service env vars."
echo "Also set OPENCLAW_GATEWAY_TOKEN to the same token value."
