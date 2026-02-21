// scripts/send_alerts.js
const StudentTracker = require('../api/tracker');

async function run() {
  const tracker = new StudentTracker(process.env.ASAAS_API_KEY);
  const data = await tracker.processDelinquency();

  // Alert Legal
  if (data.legal.length > 0) {
    const legalMsg = `⚠️ *Alerta Jurídico:* ${data.legal.length} alunos com 30 dias de atraso detectados.`;
    // logic to call WhatsApp agent
    console.log(legalMsg);
  }

  // Alert Coordination
  if (data.coordination.length > 0) {
    const coordMsg = `🛑 *Bloqueio Crítico:* ${data.coordination.length} alunos com 60+ dias de atraso. Acesso deve ser suspenso.`;
    // logic to call WhatsApp agent
    console.log(coordMsg);
  }
}

run();
