const fs = require('fs');

const mainPath = '/Users/mauricio/.openclaw/agents/main/agent/auth-profiles.json';
const mainData = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
const authProfile = mainData.auth.profiles['google-antigravity:suporte@drasacha.com.br'];

if (!authProfile) {
  console.error("No valid profile found in main");
  process.exit(1);
}

const agents = ['sdr', 'cs', 'suporte'];

for (const agent of agents) {
  const agentPath = `/Users/mauricio/.openclaw/agents/${agent}/agent/auth-profiles.json`;
  try {
    const data = JSON.parse(fs.readFileSync(agentPath, 'utf8'));
    data.auth.profiles['google-antigravity:suporte@drasacha.com.br'] = authProfile;
    
    if (!data.lastGood) data.lastGood = {};
    data.lastGood['google-antigravity'] = 'google-antigravity:suporte@drasacha.com.br';
    
    fs.writeFileSync(agentPath, JSON.stringify(data, null, 2));
    console.log('Fixed auth for ' + agent);
  } catch (e) {
    // Some agents might not have this file created yet via cli
    console.error('Failed processing ' + agent, e.message);
  }
}
