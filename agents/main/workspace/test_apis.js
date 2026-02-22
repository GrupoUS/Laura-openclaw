const fs = require('fs');
const https = require('https');

const config = JSON.parse(fs.readFileSync('/Users/mauricio/.openclaw/openclaw.json', 'utf8'));

// Get ZAI key
const zaiKey = config.auth?.providers?.zai?.env?.value || process.env.ZAI_API_KEY;
if (zaiKey) {
  console.log("Found ZAI key");
} else {
  console.log("No ZAI key in env/config");
}

// Get Anthropic key
const anthropicKey = config.auth?.store?.['anthropic:manual']?.token;
if (anthropicKey) {
  console.log("Found Anthropic manual key");
}

// Get Google key
const googleKey = config.auth?.store?.['google-gemini-cli:api-key-1']?.token;
if (googleKey) {
  console.log("Found Google key 1");
}
