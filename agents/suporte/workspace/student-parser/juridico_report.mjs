/**
 * Relatório Diário de Cobrança — Grupo Jurídico
 * Relatório COMPLETO com todos os dados para resolução de valores atrasados
 * 
 * ⚠️ GRUPO_JURIDICO: Preencher com o ID do grupo após Maurício marcar a Laura lá
 */

import { neon } from '@neondatabase/serverless';
import { exec as execCb } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCb);

const DB_URL = process.env.NEON_DATABASE_URL ||
  'postgresql://neondb_owner:npg_P0ljy3pWNTYc@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// ⚠️ PENDENTE — Maurício vai marcar a Laura no grupo do Jurídico para capturar o ID
const GRUPO_JURIDICO = process.env.GRUPO_JURIDICO || 'PENDENTE';

function formatBRL(val) {
  const n = parseFloat(val || 0);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function today() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

async function generateJuridicoReport() {
  const sql = neon(DB_URL);

  // ── Totais gerais ──
  const [totals] = await sql`
    SELECT
      COUNT(*)::int                                              AS total,
      SUM(total_paid::numeric)                                  AS arrecadado,
      SUM(total_pending::numeric)                               AS pendente,
      COUNT(*) FILTER (WHERE total_pending::numeric > 0)::int   AS inadimplentes,
      COUNT(*) FILTER (WHERE total_paid::numeric > 0 AND total_pending::numeric = 0)::int AS quitados
    FROM students
  `;

  // ── Lista completa de inadimplentes com todos os dados ──
  const inadimplentes = await sql`
    SELECT
      name,
      email,
      phone,
      cpf,
      course,
      turma,
      total_paid::numeric    AS pago,
      total_pending::numeric AS pendente,
      raw_data->>'added on'  AS data_entrada,
      raw_data->>'access type' AS tipo_acesso
    FROM students
    WHERE total_pending::numeric > 0
    ORDER BY total_pending::numeric DESC
  `;

  // ── Faixas de inadimplência ──
  const faixa1 = inadimplentes.filter(a => a.pendente >= 15000);
  const faixa2 = inadimplentes.filter(a => a.pendente >= 5000 && a.pendente < 15000);
  const faixa3 = inadimplentes.filter(a => a.pendente < 5000);

  // ── Resumo executivo ──
  const resumo = `📋 *RELATÓRIO DE COBRANÇA — JURÍDICO*
📅 ${today()}
${'━'.repeat(35)}

💼 *RESUMO EXECUTIVO*
• Total de alunos: *${totals.total}*
• Inadimplentes: *${totals.inadimplentes}* (${Math.round(totals.inadimplentes/totals.total*100)}% da turma)
• Total arrecadado: *${formatBRL(totals.arrecadado)}*
• Total em aberto: *${formatBRL(totals.pendente)}*
• Alunos quitados: *${totals.quitados}*

🔴 *FAIXA CRÍTICA (acima de R$ 15.000)*
${faixa1.length} alunos — ${formatBRL(faixa1.reduce((s,a)=>s+a.pendente,0))} total
${faixa1.map(a => `  • ${a.name}\n    📧 ${a.email}${a.phone ? '\n    📱 '+a.phone : ''}${a.cpf ? '\n    🪪 CPF: '+a.cpf : ''}\n    💰 Pago: ${formatBRL(a.pago)} | Pendente: *${formatBRL(a.pendente)}*`).join('\n\n') || '  ✅ Nenhum'}

🟡 *FAIXA ALTA (R$ 5.000 a R$ 15.000)*
${faixa2.length} alunos — ${formatBRL(faixa2.reduce((s,a)=>s+a.pendente,0))} total
${faixa2.map(a => `  • ${a.name}\n    📧 ${a.email}${a.phone ? '\n    📱 '+a.phone : ''}\n    💰 Pago: ${formatBRL(a.pago)} | Pendente: *${formatBRL(a.pendente)}*`).join('\n\n') || '  ✅ Nenhum'}

🟢 *FAIXA REGULAR (abaixo de R$ 5.000)*
${faixa3.length} alunos — ${formatBRL(faixa3.reduce((s,a)=>s+a.pendente,0))} total
${faixa3.map(a => `  • ${a.name} — Pendente: *${formatBRL(a.pendente)}*\n    📧 ${a.email}`).join('\n') || '  ✅ Nenhum'}

${'━'.repeat(35)}
_Relatório automático — Agente Suporte 🤖_
_Dados: NeonDB / Asaas_`;

  return resumo;
}

async function sendToWhatsApp(message, groupId) {
  if (!groupId || groupId === 'PENDENTE') {
    console.log('⚠️  GRUPO_JURIDICO não configurado. Exibindo relatório apenas no console.\n');
    console.log(message);
    return false;
  }

  // Usar OpenClaw Gateway API (porta 3333)
  const payload = JSON.stringify({ channel: 'whatsapp', to: groupId, message });
  const cmd = `curl -s -X POST "http://localhost:3333/api/v1/message/send" \
    -H "Authorization: Bearer 947685" \
    -H "Content-Type: application/json" \
    -d '${payload.replace(/'/g, "'\\''")}'`;

  const { stdout, stderr } = await exec(cmd);
  console.log('Gateway response:', stdout);
  if (stderr) console.error('stderr:', stderr);
  return true;
}

async function main() {
  const groupId = process.env.GRUPO_JURIDICO || GRUPO_JURIDICO;
  console.log(`[${new Date().toISOString()}] Gerando relatório jurídico...`);

  const report = await generateJuridicoReport();
  await sendToWhatsApp(report, groupId);

  console.log(`[${new Date().toISOString()}] Concluído.`);
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
