const fs = require('fs');
const pairedPath = '/Users/mauricio/.openclaw/devices/paired.json';
const pendingPath = '/Users/mauricio/.openclaw/devices/pending.json';

const paired = JSON.parse(fs.readFileSync(pairedPath, 'utf8'));
const pending = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));

const pendingReq = Object.values(pending)[0];
if (!pendingReq) {
  console.log('No pending requests to approve!');
  process.exit(0);
}

const deviceId = pendingReq.deviceId;
const now = Date.now();

paired[deviceId] = {
  deviceId: deviceId,
  publicKey: pendingReq.publicKey,
  platform: pendingReq.platform,
  clientId: pendingReq.clientId,
  clientMode: pendingReq.clientMode,
  role: pendingReq.role,
  roles: pendingReq.roles,
  scopes: pendingReq.scopes,
  tokens: {
    [pendingReq.role]: {
      token: "cli-bypass-token-" + now,
      role: pendingReq.role,
      scopes: pendingReq.scopes,
      createdAtMs: now,
      lastUsedAtMs: now
    }
  },
  createdAtMs: pendingReq.ts,
  approvedAtMs: now
};

fs.writeFileSync(pairedPath, JSON.stringify(paired, null, 2));
fs.writeFileSync(pendingPath, JSON.stringify({}, null, 2));

console.log('Successfully paired device: ' + deviceId);
