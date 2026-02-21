/**
 * Smart Student Parser - Grupo US / TRINTAE3
 * 
 * Sincroniza pastas de alunos com NeonDB, extraindo nomes inteligentemente
 * de e-mails quando o nome real não está disponível.
 * 
 * Uso:
 *   node parser.mjs --dry-run       (preview, sem alterações)
 *   node parser.mjs --execute       (executa tudo)
 *   node parser.mjs --report-only   (só relatório do estado atual)
 */

import { neon } from '@neondatabase/serverless';
import { readdir, rename, readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const DB_URL = process.env.NEON_DATABASE_URL ||
  'postgresql://neondb_owner:npg_P0ljy3pWNTYc@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const ALUNOS_BASE = '/Users/mauricio/.openclaw/alunos';
const TURMAS = [
  { course: '33', turma: 'Turma 4' },
];

// Contas institucionais/internas — ignorar
const INSTITUTIONAL_PATTERNS = [
  /^somos@/, /^admin@/, /^suporte@/, /^info@/, /^contato@/,
  /^noreply@/, /^teste@/, /^test@/, /commu\.cc$/,
];

// Nomes de partes de e-mail que indicam conta interna
const INSTITUTIONAL_USERNAMES = ['somos', 'admin', 'suporte', 'info', 'contato', 'noreply', 'teste', 'test', 'support'];

// Sufixos/abreviações profissionais ou geográficas a remover
const JUNK_SUFFIXES = ['fisio', 'mog', 'enf', 'med', 'br', 'rj', 'sp', 'go', 'mg', 'bh'];

// Fragmentos de nomes brasileiros para separação inteligente
const NAME_FRAGMENTS = [
  'ana','maria','jose','joao','pedro','paulo','luiz','luisa','carlos','marcos',
  'adriana','andrea','andria','andreia','bruna','camila','carol','carolina',
  'claudia','cristiane','cristina','daniela','debora','diana','eliane','elisa',
  'estefanie','estefania','estela','estephanie',
  'fabiana','fabiola','fernanda','flavia','francine','gabriela','gabrielle',
  'gisele','glaucia','graziela','graziely','isabela','isabella','janaina','jaqueline',
  'jessica','juliana','karina','larissa','laura','layane','leticia','liliane',
  'luciana','lucimara','luisa','mariana','marianny','marina','marisa','marta','mayara',
  'micheli','michele','milena','monique','natalia','nataline','patricia','paula','priscila',
  'raquel','renata','roberta','rosana','sabrina','samara','sammya','sandra','sarah','silvia',
  'simone','solange','stefanie','suellen','suzana','taina','tainara','tainá','talita',
  'tatiana','thaisa','thais','thamires','thatiana','thayane','thayna','vanessa','veronica',
  'viviane','yasmin','walquiria',
  // Sobrenomes comuns
  'silva','santos','oliveira','ferreira','lima','alves','jesus','costa','souza','rodrigues',
  'araujo','melo','barros','carvalho','ribeiro','martins','pereira','monteiro','almeida',
  'nascimento','cardoso','rezende','machado','mendes','guimaraes','teixeira','borges',
  'campos','moraes','cavalcante','gomes','nogueira','moreira','fernandes','nunes',
  'pimenta','freitas','brito','medeiros','abreu','rangel','figueiredo','pinheiro',
  'cunha','vieira','bezerra','macedo','andrade','assis','batista','bernardes',
  'braga','branco','cabral','castro','dias','duarte','esteves','farias','galvao',
  'lacerda','lago','leal','lemos','leite','lopes','luz','magalhaes','mendonca',
  'moura','muniz','ortiz','paiva','paixao','prado','ramos','reis','rocha','rolim',
  'rosa','saraiva','sarmento','sena','tavares','trani','vasconcelos','vaz','viana',
  'vilela','xavier','zago',
  // Prefixos
  'dra','dr','enf','prof',
];

// ─── NAME EXTRACTION ──────────────────────────────────────────────────────────

/**
 * Separa palavras concatenadas usando lista de fragmentos conhecidos
 * Ex: "brunaalvesdejesus" → ["bruna","alves","de","jesus"]
 */
function splitConcatenatedName(str) {
  str = str.toLowerCase();
  const result = [];
  let i = 0;
  
  while (i < str.length) {
    let found = false;
    // Tenta fragmentos mais longos primeiro (greedy)
    const sorted = [...NAME_FRAGMENTS].sort((a, b) => b.length - a.length);
    for (const frag of sorted) {
      if (str.startsWith(frag, i)) {
        result.push(frag);
        i += frag.length;
        found = true;
        break;
      }
    }
    if (!found) {
      // Acumula caracteres não reconhecidos até o próximo fragmento
      let buf = '';
      while (i < str.length) {
        const nextFrag = sorted.find(f => str.startsWith(f, i));
        if (nextFrag && buf.length > 0) break;
        buf += str[i];
        i++;
      }
      if (buf) result.push(buf);
    }
  }
  return result;
}

/**
 * Extrai nome humano de um e-mail de forma inteligente
 * Retorna null se for conta institucional
 */
export function extractNameFromEmail(email) {
  if (!email || !email.includes('@')) return null;
  
  // Verificar se é conta institucional
  if (INSTITUTIONAL_PATTERNS.some(p => p.test(email.toLowerCase()))) return null;
  
  const [username] = email.toLowerCase().split('@');
  
  if (INSTITUTIONAL_USERNAMES.includes(username)) return null;
  if (username.length < 3) return null;
  
  // Prefixos especiais: "dra", "dr", "enf", "prof" → tratamento especial
  let processedUsername = username;
  
  // Remover sufixos numéricos longos (ex: "2914", "74", "1")
  // e separadores comuns
  let parts = processedUsername.split(/[._\-]/).filter(Boolean);
  
  // Remover partes que são APENAS números
  parts = parts.filter(p => !/^\d+$/.test(p));
  
  // Para cada parte, remover trailing numbers
  parts = parts.map(p => p.replace(/\d+$/, '').trim()).filter(Boolean);
  
  // Se só sobrou uma parte longa (provavelmente concatenado), tentar separar
  if (parts.length === 1 && parts[0].length > 8) {
    const fragments = splitConcatenatedName(parts[0]);
    if (fragments.length > 1) {
      parts = fragments;
    }
  } else if (parts.length > 1) {
    // Para cada parte, verificar se é concatenado e separar
    const expanded = [];
    for (const part of parts) {
      if (part.length > 8) {
        const fragments = splitConcatenatedName(part);
        if (fragments.length > 1) {
          expanded.push(...fragments);
          continue;
        }
      }
      expanded.push(part);
    }
    parts = expanded;
  }
  
  // Remover sufixos profissionais/geográficos
  parts = parts.filter(p => !JUNK_SUFFIXES.includes(p.toLowerCase()));
  
  // Remover palavras de 1-2 letras que não são iniciais úteis (ex: "de", "da", "do")
  // Manter "de", "da", "do", "das", "dos" como conectores
  const CONNECTORS = ['de', 'da', 'do', 'das', 'dos', 'e'];
  // Filtrar partes de 1 caractere que não são conectores conhecidos (evita "E" no início)
  parts = parts.filter(p => p.length > 1 || CONNECTORS.includes(p.toLowerCase()));
  const cleaned = parts.filter(p => p.length > 0);
  
  if (cleaned.length === 0) return null;
  
  // Title case com exceção para conectores
  const titled = cleaned.map((word, i) => {
    if (i > 0 && CONNECTORS.includes(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
  
  const name = titled.join(' ');
  
  // Validação final: nome precisa ter pelo menos 3 caracteres
  if (name.length < 3) return null;
  
  return name;
}

/**
 * Verifica se um e-mail é de conta institucional
 */
function isInstitutional(email) {
  if (!email) return false;
  return INSTITUTIONAL_PATTERNS.some(p => p.test(email.toLowerCase()));
}

// ─── FOLDER OPERATIONS ───────────────────────────────────────────────────────

/**
 * Verifica se o nome da pasta é um e-mail (problema)
 */
function isEmailName(folderName) {
  return folderName.includes('@') || folderName.includes('_gmail') || 
         folderName.includes('_hotmail') || folderName.includes('_outlook') ||
         folderName.includes('_icloud') || folderName.includes('_yahoo') ||
         folderName.includes('.com') || folderName.includes('.cc') ||
         folderName.includes('.br');
}

/**
 * Verifica se o nome da pasta é um SEM_NOME
 */
function isSemNome(folderName) {
  return folderName.startsWith('SEM_NOME');
}

/**
 * Lê conteúdo de um DOCX como texto bruto via XML
 */
async function readDocxContent(docxPath) {
  try {
    // DOCX é um ZIP — vamos extrair o document.xml via unzip
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync(
      `unzip -p "${docxPath}" word/document.xml 2>/dev/null | sed 's/<[^>]*>//g' | tr -s ' ' | head -50`
    );
    return stdout;
  } catch {
    return '';
  }
}

// ─── DATABASE OPERATIONS ─────────────────────────────────────────────────────

async function getStudentsFromDB(sql) {
  return sql`SELECT * FROM students ORDER BY name`;
}

async function updateStudentName(sql, email, newName) {
  return sql`UPDATE students SET name = ${newName} WHERE email = ${email} RETURNING *`;
}

// ─── MAIN SYNC LOGIC ─────────────────────────────────────────────────────────

async function processFolder(folderPath, folderName, dryRun) {
  const result = {
    original: folderName,
    newName: null,
    action: 'skip',
    reason: '',
    email: null,
  };
  
  // Pular pastas que já têm nome completo (com espaço, sem @, sem SEM_NOME)
  if (!isEmailName(folderName) && !isSemNome(folderName)) {
    result.action = 'ok';
    result.reason = 'Nome completo já correto';
    return result;
  }
  
  // Encontrar o arquivo DOCX dentro da pasta
  let files;
  try {
    files = await readdir(folderPath);
  } catch {
    result.action = 'error';
    result.reason = 'Não foi possível ler a pasta';
    return result;
  }
  
  const docxFile = files.find(f => f.endsWith('.docx'));
  
  if (!docxFile) {
    result.action = 'error';
    result.reason = 'Pasta vazia (sem DOCX)';
    return result;
  }
  
  const docxPath = path.join(folderPath, docxFile);
  
  // Ler conteúdo do DOCX para extrair e-mail real
  const content = await readDocxContent(docxPath);
  
  // Extrair email do conteúdo
  const emailMatch = content.match(/Email:\s*([^\s\n]+)/);
  const email = emailMatch ? emailMatch[1].trim() : null;
  result.email = email;
  
  // Verificar se é conta institucional
  if (email && isInstitutional(email)) {
    result.action = 'skip_institutional';
    result.reason = `Conta institucional: ${email}`;
    return result;
  }
  
  // Verificar se tem nome real no conteúdo
  const nameMatch = content.match(/Name:\s*([^\n@]+)\n/);
  let extractedName = nameMatch ? nameMatch[1].trim() : null;
  
  // Se o nome extraído ainda é um email, usar extração inteligente
  if (!extractedName || extractedName.includes('@') || extractedName.length < 3) {
    extractedName = email ? extractNameFromEmail(email) : null;
  }
  
  // Se tiver SEM_NOME, tentar extrair do username do folder
  if (!extractedName && isSemNome(folderName)) {
    const usernameFromFolder = folderName.replace('SEM_NOME_', '');
    extractedName = extractNameFromEmail(usernameFromFolder + '@placeholder.com');
  }
  
  if (!extractedName) {
    result.action = 'error';
    result.reason = 'Não foi possível extrair nome';
    return result;
  }
  
  result.newName = extractedName;
  result.action = dryRun ? 'would_rename' : 'renamed';
  
  if (!dryRun) {
    const newFolderPath = path.join(path.dirname(folderPath), extractedName);
    const newDocxName = `Ficha_Completa_${extractedName}.docx`;
    const newDocxPath = path.join(newFolderPath, newDocxName);
    
    try {
      // Renomear o arquivo DOCX primeiro
      await rename(docxPath, path.join(folderPath, newDocxName));
      // Renomear a pasta
      await rename(folderPath, newFolderPath);
      result.action = 'renamed';
    } catch (err) {
      result.action = 'error';
      result.reason = `Erro ao renomear: ${err.message}`;
    }
  }
  
  return result;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const reportOnly = args.includes('--report-only');
  const execute = args.includes('--execute');
  
  if (!dryRun && !reportOnly && !execute) {
    console.log('⚠️  Especifique --dry-run, --execute, ou --report-only');
    console.log('\nExemplos:');
    console.log('  node parser.mjs --dry-run      (preview sem alterações)');
    console.log('  node parser.mjs --execute      (executa renomeação + sync)');
    console.log('  node parser.mjs --report-only  (só estado atual)');
    process.exit(1);
  }
  
  console.log(`\n🚀 Student Parser v1.0 — Grupo US`);
  console.log(`📅 ${new Date().toLocaleString('pt-BR')}`);
  console.log(`🔧 Modo: ${dryRun ? 'DRY RUN (sem alterações)' : reportOnly ? 'RELATÓRIO' : 'EXECUÇÃO REAL'}\n`);
  
  const sql = neon(DB_URL);
  
  // ── Relatório do estado atual do DB ──
  const dbStudents = await getStudentsFromDB(sql);
  const emailNames = dbStudents.filter(s => s.name && s.name.includes('@'));
  const semNomes = dbStudents.filter(s => s.name && s.name.startsWith('SEM_NOME'));
  const partialNames = dbStudents.filter(s => s.name && !s.name.includes('@') && !s.name.includes(' ') && !s.name.startsWith('SEM_NOME'));
  const goodNames = dbStudents.filter(s => s.name && !s.name.includes('@') && s.name.includes(' ') && !s.name.startsWith('SEM_NOME'));
  
  console.log('📊 ESTADO ATUAL DO BANCO DE DADOS:');
  console.log(`  ✅ Nome completo:     ${goodNames.length} alunos`);
  console.log(`  ⚠️  Apenas 1 nome:    ${partialNames.length} alunos`);
  console.log(`  ❌ Email como nome:   ${emailNames.length} alunos`);
  console.log(`  🚫 SEM_NOME:          ${semNomes.length} alunos`);
  console.log(`  📦 Total:             ${dbStudents.length} alunos\n`);
  
  if (reportOnly) {
    console.log('\n📋 Lista de alunos com problemas:\n');
    console.log('  --- EMAIL COMO NOME ---');
    emailNames.forEach(s => console.log(`    ${s.email} → "${extractNameFromEmail(s.email) || '(sem extração)'}"`));
    console.log('\n  --- SEM NOME ---');
    semNomes.forEach(s => console.log(`    ${s.email} → "${extractNameFromEmail(s.email) || '(sem extração)'}"`));
    return;
  }
  
  // ── Processar pastas ──
  const results = { ok: [], renamed: [], would_rename: [], skipped: [], errors: [] };
  
  for (const { course, turma } of TURMAS) {
    const turmaPath = path.join(ALUNOS_BASE, course, turma);
    
    let folders;
    try {
      folders = await readdir(turmaPath);
    } catch {
      console.error(`❌ Não foi possível ler: ${turmaPath}`);
      continue;
    }
    
    console.log(`\n📂 Processando: ${course}/${turma} (${folders.length} pastas)`);
    console.log('─'.repeat(60));
    
    for (const folderName of folders.sort()) {
      const folderPath = path.join(turmaPath, folderName);
      
      const fStat = await stat(folderPath).catch(() => null);
      if (!fStat || !fStat.isDirectory()) continue;
      
      const result = await processFolder(folderPath, folderName, dryRun);
      result.turmaPath = turmaPath;
      
      if (result.action === 'ok') {
        results.ok.push(result);
      } else if (result.action === 'renamed' || result.action === 'would_rename') {
        results.renamed.push(result);
        // Atualizar NeonDB também
        if (!dryRun && result.email && result.newName) {
          try {
            await updateStudentName(sql, result.email, result.newName);
          } catch (err) {
            console.error(`  DB update error for ${result.email}: ${err.message}`);
          }
        }
        const icon = dryRun ? '🔵' : '✅';
        console.log(`  ${icon} "${folderName}"`);
        console.log(`     → "${result.newName}"`);
      } else if (result.action === 'skip_institutional') {
        results.skipped.push(result);
        console.log(`  🚫 IGNORADO (institucional): "${folderName}"`);
      } else if (result.action === 'error') {
        results.errors.push(result);
        console.log(`  ❌ ERRO: "${folderName}" — ${result.reason}`);
      }
    }
  }
  
  // ── Resumo final ──
  console.log('\n' + '═'.repeat(60));
  console.log('📋 RESUMO FINAL:');
  console.log(`  ✅ Já corretos (sem ação):      ${results.ok.length}`);
  console.log(`  ${dryRun ? '🔵 Seriam renomeados:' : '✅ Renomeados com sucesso:'} ${results.renamed.length.toString().padStart(15 - (dryRun ? 21 : 22))}`);
  console.log(`  🚫 Ignorados (institucionais):  ${results.skipped.length}`);
  console.log(`  ❌ Erros:                       ${results.errors.length}`);
  
  if (dryRun && results.renamed.length > 0) {
    console.log('\n⚡ Para executar as renomeações: node parser.mjs --execute');
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Detalhes dos erros:');
    results.errors.forEach(e => console.log(`  "${e.original}" → ${e.reason}`));
  }
  
  console.log('\n✨ Sync concluído!\n');
}

run().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
