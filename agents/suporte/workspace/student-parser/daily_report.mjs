/**
 * Relatório Diário de Alunos — Grupo US
 * Enviado via WhatsApp para o Grupo de Coordenação TRINTAE3
 * Segunda a Sexta, 10h da manhã
 * 
 * Uso: node daily_report.mjs
 */

import { neon } from '@neondatabase/serverless';
import { exec as execCb } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCb);

const DB_URL = process.env.NEON_DATABASE_URL ||
  'postgresql://neondb_owner:npg_P0ljy3pWNTYc@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const GRUPO_COORDENACAO = '120363174134875759@g.us';

function formatBRL(val) {
  const n = parseFloat(val || 0);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function today() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

async function generateReport() {
  const sql = neon(DB_URL);

  // ── Totais gerais ──
  const [totals] = await sql`
    SELECT
      COUNT(*)::int                                              AS total,
      SUM(total_paid::numeric)                                  AS arrecadado,
      SUM(total_pending::numeric)                               AS pendente,
      COUNT(*) FILTER (WHERE total_pending::numeric > 0)::int   AS inadimplentes,
      COUNT(*) FILTER (WHERE total_paid::numeric > 0 AND total_pending::numeric = 0)::int AS quitados,
      COUNT(*) FILTER (WHERE total_paid::numeric = 0 AND total_pending::numeric = 0)::int AS sem_financeiro
    FROM students
  `;

  // ── Top inadimplentes (maior pendência) ──
  const topInadimplentes = await sql`
    SELECT name, email, total_pending::numeric AS pendente
    FROM students
    WHERE total_pending::numeric > 0
    ORDER BY total_pending::numeric DESC
    LIMIT 5
  `;

  // ── Alunos sem nome completo ──
  const semNome = await sql`
    SELECT COUNT(*)::int AS total
    FROM students
    WHERE name LIKE '%@%' OR name LIKE 'SEM_NOME%' OR name NOT LIKE '% %'
  `;

  // ── Progresso médio ──
  const [progresso] = await sql`
    SELECT
      AVG((raw_data->>'progress %')::numeric)::numeric(5,1) AS media_progresso,
      COUNT(*) FILTER (WHERE (raw_data->>'progress %')::numeric > 0)::int AS com_acesso
    FROM students
    WHERE raw_data->>'progress %' IS NOT NULL
  `;

  // ── Alunos adicionados essa semana ──
  const [novos] = await sql`
    SELECT COUNT(*)::int AS total
    FROM students
    WHERE last_sync >= NOW() - INTERVAL '7 days'
  `;

  // ── Buscar TODOS os inadimplentes (não só top 5) ──
  const todosInadimplentes = await sql`
    SELECT name, email, total_pending::numeric AS pendente
    FROM students
    WHERE total_pending::numeric > 0
    ORDER BY total_pending::numeric DESC
  `;

  // ── Montar a mensagem — APENAS INADIMPLENTES ──
  const listaInadimplentes = todosInadimplentes.map((a, i) => {
    const nome = a.name.length > 30 ? a.name.substring(0, 29) + '…' : a.name;
    return `${i + 1}. ${nome} — ${formatBRL(a.pendente)}`;
  }).join('\n');

  const message = `⚠️ *Inadimplentes — Pós TRINTAE3*
📅 ${today()}

*${todosInadimplentes.length} alunos com pagamento em aberto:*
Total pendente: *${formatBRL(totals.pendente)}*

${listaInadimplentes || '✅ Nenhum inadimplente!'}

_Relatório automático — Agente Suporte 🤖_`;

  return message;
}

async function sendToWhatsApp(message) {
  // Usar OpenClaw Gateway API (porta 3333)
  const payload = JSON.stringify({ channel: 'whatsapp', to: GRUPO_COORDENACAO, message });
  const escaped = payload.replace(/'/g, "'\\''");
  const cmd = `curl -s -X POST "http://localhost:3333/api/v1/message/send" \
    -H "Authorization: Bearer 947685" \
    -H "Content-Type: application/json" \
    -d '${escaped}'`;

  const { stdout, stderr } = await exec(cmd);
  console.log('Gateway response:', stdout);
  if (stderr) console.error('stderr:', stderr);
  return true;
}

async function main() {
  console.log(`[${new Date().toISOString()}] Gerando relatório diário...`);
  
  try {
    const report = await generateReport();
    console.log('\n=== RELATÓRIO ===\n');
    console.log(report);
    console.log('\n=================\n');
    
    await sendToWhatsApp(report);
    console.log(`[${new Date().toISOString()}] Relatório enviado com sucesso!`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Erro:`, err.message);
    process.exit(1);
  }
}

main();
