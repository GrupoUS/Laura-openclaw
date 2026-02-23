const { execSync } = require('child_process');

function main() {
  const sessionsRaw = execSync('openclaw sessions --limit 100 --json').toString();
  const sessions = JSON.parse(sessionsRaw).sessions;
  
  const unanswered = sessions.filter(s => 
    s.key.startsWith('agent:main:whatsapp:direct:') && 
    s.messages && s.messages.length > 0 && 
    s.messages[s.messages.length - 1].role === 'user'
  );
  
  if (unanswered.length > 0) {
    console.log(JSON.stringify(unanswered.map(s => ({
      key: s.key,
      last_msg: s.messages[s.messages.length - 1].content
    })), null, 2));
  } else {
    console.log("None");
  }
}
main();
