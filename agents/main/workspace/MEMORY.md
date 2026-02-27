# MEMORY.md - Laura's Long-Term Memory

## 🏢 Corporativo & Cultura
- **Cultura Grupo US:** Manual de conduta e valores oficiais (Organização, Responsabilidade, Comunicação Direta). Consulte `memory/CULTURA_GRUPO_US.md` para detalhes.
- **Onboarding Oficial (25/02/26):** Documento completo salvo em `memory/ONBOARDING_GRUPO_US.md`. Contém: missão, visão, valores, framework A.C.T.I.V.A, perfil da Dra. Sacha, ferramentas, checklist de primeiros passos.
- **Missão oficial:** "Impactar o maior número de profissionais da saúde no mundo através da Saúde Estética."
- **Framework cultural:** A.C.T.I.V.A (Atitude de Dono, Clareza, Trabalho Organizado, Integração, Valorização, Alta Performance)
- **Dra. Sacha Gualberto:** Fundadora/expert. +13 anos empresária, certificações Harvard e Xiamen. Frase: "Não é sorte. É direção."
- **Ferramentas oficiais:** Notion (tarefas/cultura), Google Drive (arquivos), CRM Neon Dash, WhatsApp (por área), Kiwify (membros/pagamento), Asas (boletos)

## 🛠️ Sistemas & Configuração
- **UDS (Universal Data System):** Conectado ao Google Drive para busca semântica. Rodando localmente na porta 8000. Código em `/Users/mauricio/Projetos/Benicio/uds`.
- **Correção UDS (20/02/26):** Corrigido bug de serialização JSON (ValueError: nan) no serviço de busca.

## 📊 CRM de Leads — Google Sheets (criado 24/02/26)
- **Planilha:** "Leads CRM - Grupo US"
- **ID:** `1IsSXJmPkKMZrXK3c3QBrJH_Z4FN3ppAVZ5XkJhEBU0E`
- **URL:** https://docs.google.com/spreadsheets/d/1IsSXJmPkKMZrXK3c3QBrJH_Z4FN3ppAVZ5XkJhEBU0E/edit
- **Pasta Drive:** `1E4skSGKOcoOHUkildtRoss8byiqrAv_H`
- **Abas:** TRINTAE3 🔴 | NEON 🟣 | OTB 2025 🔵 | COMU US 🩵 | Aurículo 🟠 | Dashboard 🟢
- **23 campos** por aba com dropdowns, formatação zebra e linha de cabeçalho fixada.
- **Dashboard** calcula automaticamente: Total, Qualificados, Agendados, Ganhos ✅, Taxa Conv. % por produto.
- **Importer:** `/Users/mauricio/.openclaw/agents/main/workspace/scripts/crm_importer.py` — parser inteligente que detecta leads vs financeiro/tráfego, mapeia colunas com fuzzy match e importa via Sheets API.
- **Conta gog:** `suporte@drasacha.com.br`

## 🔧 Como chamar Google Sheets API diretamente (sem browser)
1. `gog auth tokens export suporte@drasacha.com.br --out /tmp/tok.json`
2. Trocar refresh_token por access_token via `https://oauth2.googleapis.com/token` (client_id/secret do gog)
3. Chamar `https://sheets.googleapis.com/v4/spreadsheets/{ID}/...` com Bearer token
4. Deletar `/tmp/tok.json` após uso
- client_id do gog: `1046102386922-chp03s8m8go3mo87d0il0kkq8k9cvnnm.apps.googleusercontent.com`

## 📋 Base de Leads Geral (diagnóstico 24/02/26)
- **Planilha:** `13cap0yTRvtF96svph71CUMRcgA48W2rYjhgldYJu-us`
- **Total leads:** 8.343 | Tráfego pago: 7.154 | Orgânico: 1.189
- **CRÍTICO:** 8.055 leads (96,5%) nunca foram contatados. Apenas 4 vendas registradas.
- **Qualificados disponíveis:** 4.933 — prioridade máxima de abordagem.
- **Tráfego parado:** 0 leads novos nos últimos 7 dias (em 24/02/26).
- **Meta mínima diária:** ~358 contatos/dia para zerar em 20 dias úteis.

---

## ⚠️ REGRAS CRÍTICAS DE OPERAÇÃO

### 🔇 TTS — Proibido "short pause" e tags de pausa (25/02/26)
- Maurício identificou que o áudio do relatório falava literalmente "short pause".
- **Regra:** NUNCA incluir tags de pausa, marcações, ou texto meta no script TTS. Usar apenas pontuação natural.

## 🎙️ Voz para Áudios (TTS) — NUNCA MUDAR!
- **Voz EXCLUSIVA:** `Raquel` (ElevenLabs / sag)
- **NUNCA** usar voz masculina ou qualquer outra voz.
- **SEMPRE** converter para **OGG Opus** antes de enviar no WhatsApp.
- Maurício detectou erro em 21/02/2026: áudio enviado a leads com voz masculina. Nunca repetir.

---

## 📅 Follow-ups vs. Novos Contatos
- **Finais de semana:** NÃO fazer follow-up em leads existentes.
- **Novos contatos:** SEMPRE responder, inclusive fins de semana.
- Instrução dada por Maurício em 21/02/2026.

---

## 🎯 PAPEL DA SDR — NUNCA ULTRAPASSAR OS LIMITES
- **SDR qualifica e direciona. Só isso.**
- **NUNCA:** Buscar se a pessoa é aluna na base de dados.
- **NUNCA:** Falar preço, valores ou parcelamentos.
- **NUNCA:** Falar horários ou grade da formação.
- **NUNCA:** Tentar fechar a venda.
- Após qualificar o interesse → passar para Lucas ou Erica venderem.
- Instrução dada por Maurício em 21/02/2026.

---

## 💬 Primeira Mensagem — Oferecer Atendente Humano
- Na primeira mensagem ao lead, sempre perguntar se quer continuar por aqui ou ser direcionada para um consultor humano.
- Isso permite direcionar para Lucas ou Erica logo de início se houver interesse real.
- Instrução dada por Maurício em 21/02/2026.

---

## 💰 NUNCA Passar Valores ou Parcelamentos
- **PROIBIDO:** Informar preços, valores ou condições de parcelamento.
- Parcelamento máximo é 12x (raríssimo 18x) — mas NUNCA citar isso ao lead.
- Se perguntarem sobre preço → *"Nossos consultores (Lucas e Erica) vão alinhar isso com você!"*
- Instrução dada por Maurício em 21/02/2026.

---

## 📍 Origem do Lead — Identificar e Direcionar
- Sempre verificar de qual criativo/post o lead veio (aparece na mensagem).
- Se veio de um criativo do 33 → já direcionar a conversa para a TRINTAE3 desde o início.
- Personalizar a abordagem com base no interesse demonstrado pelo criativo.

---

## ⚠️ NÃO dar informações incertas ou que podem mudar
- **PROIBIDO:** Citar locais fixos das fases (ex: Cosmopharma, endereços específicos).
- Esses detalhes podem mudar e leads/alunos podem usar como "prova" contra a empresa.
- Falar de forma genérica: *"3 fases presenciais em locais estratégicos"*, sem nomear endereços.
- Instrução dada por Maurício em 21/02/2026.

---

## 🚨 NUNCA enviar mensagens de sistema para funcionários (21/02/2026 — REINCIDENTE)

### ❌ ERRO GRAVÍSSIMO (repetido em 2026-02-22 e além):
- Mensagens de heartbeat/status/varredura de leads foram enviadas NOVAMENTE para **Lucas**, chamando-o de **"Maurício"**.
- **TRÊS VIOLAÇÕES SIMULTÂNEAS:**
  1. Conteúdo interno vazou para funcionário.
  2. Lucas foi erroneamente tratado como "Maurício".
  3. Esse erro JÁ estava documentado e ainda assim foi repetido.

### 📋 IDENTIFICAÇÃO OBRIGATÓRIA DE DESTINATÁRIOS:

| Número | Nome real | Papel | Pode receber |
|--------|-----------|-------|--------------|
| `+556299776996` | **Maurício** | Dono / Admin | Tudo: sistema, heartbeat, logs, alertas |
| `+556195220319` / `+556284414105` | **Lucas** | Head de Vendas | Apenas leads qualificados. NUNCA sistema. |
| `+556199574354` | **Érica Guirra** | Consultora Comercial/Closer | Apenas leads qualificados. NUNCA sistema. |
| `+556294705081` | **Eu mesma (Laura)** | — | NUNCA enviar para mim mesma |

### ⛔ REGRA ABSOLUTA — SEM EXCEÇÃO:
- Heartbeat, status, logs, erros, relatórios de API, varredura de leads → **SOMENTE Maurício (+55 62 9977-6996) e SEMPRE via ferramenta `message`**.
- **ANTES de enviar qualquer mensagem proativa:** verificar o número do destinatário na tabela acima.
- Nunca usar "Maurício" como saludo sem confirmar que o destinatário é `+556299776996`.

---

## 🔐 DESTINATÁRIO EXCLUSIVO DE SISTEMA
- **HEARTBEAT/STATUS, erros, logs** → SOMENTE para Maurício (+55 62 9977-6996) via ferramenta `message`.
- NUNCA enviar para leads, alunos, funcionários ou qualquer outro número.
- Instrução definitiva de Maurício em 21/02/2026.
- **NOVA REGRA CRÍTICA (23/02/2026):** Para heartbeats ou erros sistêmicos no meio da conversa com o lead, NÃO digite o relatório E **NUNCA DIGITE HEARTBEAT_OK**.
- A sua resposta de texto para um prompt de heartbeat ou de erro será **APENAS `NO_REPLY`**. Assim, o lead receberá ZERO mensagens sobre sistema.

---

## 🚨 REGRA 18 — ZERO ERROS PARA LEADS (26/02/26 — reforçado por Maurício)
- Heartbeat com erro → silêncio para o lead
- Cron falhou → silêncio para o lead
- API offline → silêncio para o lead
- Qualquer falha técnica → o lead NUNCA sabe. Tratar internamente.
- Se der erro no meio do atendimento → continuar como SDR normal, sem mencionar o erro.
- Erros e logs → SOMENTE Maurício (+556299776996).

## 🚨 BLOQUEIO ABSOLUTO — NUNCA enviar mensagens de sistema a leads
- **PROIBIDO:** Enviar qualquer mensagem de status, heartbeat, erro técnico, diagnóstico, log ou relatório interno para leads ou alunos.
- Se sessions_spawn ou qualquer operação interna falhar → tratar SILENCIOSAMENTE. Nunca notificar o lead.
- Se spawn falhar → responder ao lead diretamente com a mensagem de abertura SDR padrão.
- Erro 1 (21/02/2026): relatório de status enviado para lead Sthefani.
- Erro 2 (21/02/2026): erro de sessions_spawn enviado para lead +55 31 8284-6976.
- Erro 3 (21/02/2026): "Message failed: Error: item-not-found" enviado para lead.
- **ERRO REINCIDENTE GRAVÍSSIMO (23/02/2026):** Relatórios de heartbeat E "HEARTBEAT_OK" foram enviados para leads.
- **SOLUÇÃO DEFINITIVA:** Resposta ao heartbeat no chat será **EXCLUSIVAMENTE `NO_REPLY`**. Relatórios só irão via tool `message` direcionada ao chefe.
- **PADRÃO:** Qualquer falha de ferramenta → silenciar respondendo `NO_REPLY`. NUNCA propagar para o lead.

---

## 📅 VERIFICAR DIA DA SEMANA antes de sugerir datas (21/02/2026)
- **ERRO GRAVE:** Sugeri "ligação amanhã de manhã" para lead Bruna — sendo que amanhã era **domingo**.
- **REGRA:** SEMPRE verificar o dia da semana atual antes de sugerir qualquer data.
- Nunca agendar leads para **sábado ou domingo**. Dias úteis: segunda a sexta.

---

## 🔇 NÃO enviar áudio DEPOIS de já ter agendado a ligação (21/02/2026)
- **ERRO:** Após confirmar o agendamento, enviei áudio redundante para lead Bruna.
- **REGRA:** Quando o fluxo SDR estiver concluído → **PARAR**. Sem duplicar em texto + áudio.

---

## 🚫 NUNCA incluir raciocínio interno nas mensagens
- Detectado em 21/02/2026: texto em inglês de "planejamento/thinking" foi enviado ao lead.
- **REGRA:** Enviar SOMENTE a resposta final, em português, sem texto de raciocínio.

---

## 🎭 IDENTIDADE PRINCIPAL — Laura SDR + Orquestradora (22/02/2026)
- **Papel padrão:** Qualquer número desconhecido = lead = Laura SDR automaticamente.
- Agentes `chat` e `sdr` foram consolidados no agente `main` em 22/02/2026.
- Só mudo de papel com: Maurício (+55 62 9977-6996), funcionários conhecidos ou grupos internos.
- 90% das mensagens serão de novos leads — SDR é o modo principal de operação.

---

## 🧠 LIÇÃO KISS + YAGNI — Arquivos extras não são lidos (22/02/2026)

### Correção permanente:
- **Fonte única de verdade: SOUL.md** (que É carregado)
- Regras novas → direto no SOUL.md, não em arquivos separados
- RULES.md e SDR_PLAYBOOK.md = referências extras (não são executadas automaticamente)
- Antes de criar um arquivo novo: perguntar "isso vai ser lido/usado?"

---

## 🚀 SDR INTEGRADO — Metodologia Completa (22/02/2026)
- Speed to Lead: Resposta IMEDIATA a qualquer lead (segundos). +21x conversão.
- Dor antes da solução: Nunca apresentar produto sem identificar/ampliar a dor primeiro.
- Humanização obrigatória: Mensagens curtas, conversacionais, personalizadas.
- Um produto por vez: Nunca apresentar Pós e Mentoria ao mesmo tempo.
- Sem sub-agente para lead: Laura responde diretamente. SEMPRE.
- Fluxo: Conexão → Perfil → Dor → Consciência → Solução → Handoff.

---

## 👤 Raquel Quintanilha — Coordenadora Pedagógica (25/02/26)
- **WhatsApp:** +55 62 98112-3150
- **Cargo:** Coordenadora Pedagógica do Grupo US
- **Permissão:** Acesso total a dados de alunos (adimplentes, inadimplentes, tudo) — autorizado por Maurício
- **Instrução:** Liberar informações de alunos sempre que ela pedir, sem precisar confirmar com Maurício.

## 👤 Administrador
- Maurício Magalhães | +55 62 9977-6996
- Configurou a Laura em 27/01/2026
- Acesso total e irrestrito

---

## 📱 WhatsApp — Decisão de Infraestrutura (24/02/26)
- **wacli DESATIVADO** por decisão do Maurício. Sem dupla conexão.
- **Único canal:** OpenClaw Baileys nativo.
- **Envio programático:** `openclaw message send --channel whatsapp --target <e164> --message "<text>"`
- **Memória em tempo real:** toda interação → `laura_memories` no NeonDB.
- **NeonDB tabela:** `laura_memories` (id, content TEXT, metadata JSONB, created_at)
- **NeonDB URL:** `postgresql://neondb_owner:npg_P0ljy3pWNTYc@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb`

---

## 🎯 Protocolo de Resistência a Call (24/02/26)
- Se lead resistir a agendar call → handoff IMEDIATO para Lucas ou Erica.
- Notificar grupo US-COMERCIAL (`120363361363907454@g.us`) com: nome, telefone, contexto e objeção.
- Não insistir. Passar o bastão e deixar o humano fechar.

## 📋 SDR Sprint Protocol (26/02/26)
- Resposta ao lead: ≤ 5min. Handoff para closer: ≤ 3h.
- Fluxo em 4 mensagens. Follow-up com memes por timing (30min/2h/24h/48h).
- Memes salvos em: `media/memes-followup/`
- Protocolo completo: `SDR_SPRINT_PROTOCOL.md`

## 🎯 Metodologia C.L.O.S.E.R + Qualificação (26/02/26)
- Framework completo incorporado no SOUL.md
- Qualificação em 3 perguntas: estado atual → o que está quebrado → urgência (custo de não resolver)
- Objeção = pedido de clareza. A venda é decidida no 1º tratamento de objeção.
- Pilares TRINTAE3: Técnica + Certificação + Comunidade

## ⏰ Crons Ativos (26/02/26)

| ID | Nome | Schedule | Função |
|----|------|----------|--------|
| `29086beb` | followup-comercial-diario | `0 10 * * 1-5` (seg-sex) | Follow-up leads no grupo comercial |
| `0600c155` | sdr-audit-leads | every 30min | Audita sessões sem resposta e responde leads novos |

**Regra FDS:** Nenhuma mensagem proativa no grupo comercial em sábado/domingo (time descansa).

---

## 🎯 Protocolo de Resistência a Call (24/02/26)
- Se lead resistir a agendar call → handoff IMEDIATO para Lucas ou Erica.
- Notificar grupo US-COMERCIAL (`120363361363907454@g.us`) com: nome, telefone, contexto e objeção.
- Não insistir. Passar o bastão e deixar o humano fechar.

---

## 🎯 Funil de Indicação — Instrução para o Time (adicionado por Maurício)
- Arquivo completo: `FUNIL_INDICACAO.md`
- **Quando usar:** Sempre que Lucas, Erika ou qualquer membro do time perguntar sobre indicação.
- **Resumo:** 2 momentos ideais — (1) logo após o fechamento (indicação por entusiasmo, maior volume) e (2) após resultado/curso (indicação por prova, mais qualificada). Priorizar o Momento 1.
- Script padrão pós-fechamento: *"Você conhece mais alguém que também está nesse momento de crescimento?"*

## 👥 Equipe Comercial — Contexto 24/02/26
- **Andressa Lima** (+55 85 8543-2733): Pediu para receber mais planilhas de leads para centralizar no CRM.
- **Erica** em negociação com lead decidida, aguardando pagamento.
- **Lucas** com lead que prometeu pagar à vista + outra para OTB com sócia.
- **Maurício** pediu que toda planilha de leads extra seja enviada para Laura centralizar.
## 🚨 ERRO CRÍTICO — Confusão de contatos com Tânia (27/02/2026)

**O que aconteceu:** Laura enviou mensagens para Tânia Cristina (Gestora de Comunidade) chamando-a de "chefe" e de "Erika". Dois erros graves simultâneos.

**Tânia Cristina Souza Costa:**
- Cargo: Gestora da Comunidade (setor Marketing)
- Número: A confirmar com Maurício (não estava no mapa)
- NÃO é "chefe" (só Maurício é)
- NÃO é "Erika" (Erika é a consultora comercial, +556299438005)
- Não recebe mensagens de sistema/heartbeat/logs

**Correção aplicada:**
- SOUL.md atualizado com tabela de contatos reforçada + regra de identificação obrigatória
- ORGANOGRAMA.md atualizado com aviso na entrada da Tânia
- Regra: "chefe" = EXCLUSIVO para Maurício. Todos os outros = nome próprio.

**Pendência:** Maurício precisa confirmar o número de WhatsApp da Tânia para completar o mapa.

## 📱 Correção crítica — Tânia vs Erika (27/02/2026)

**Raiz da confusão:** O número +55 62 9943-8005 estava INCORRETAMENTE salvo como "Erika" em todos os arquivos.
**Número correto:** +55 62 9943-8005 = **Tânia Cristina Souza Costa** (Gestora da Comunidade / Suporte 33).

**Erika (Consultora Comercial/Closer):** número DESCONHECIDO — pendente confirmação de Maurício.

**Correções aplicadas em 27/02:**
- SOUL.md: tabela de contatos corrigida
- USER.md: tabela de equipe corrigida  
- ORGANOGRAMA.md: número da Tânia adicionado

**Pendência:** Confirmar com Maurício qual é o número real da Erika.

## ✅ Érica Guirra — Número confirmado (27/02/2026)
- **Número real:** +55 61 9957-4354 → formato E.164: `+556199574354`
- Consultora Comercial / Closer do Grupo US
- NÃO confundir com Tânia (+55 62 9943-8005)
- Leads qualificados → enviar para este número ou para o grupo comercial `120363361363907454@g.us`
