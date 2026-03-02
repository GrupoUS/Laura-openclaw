# TOOLS.md - Laura | Chat-SDR-Orquestradora

## 📍 Fontes de Recursos
- **SCRIPTS:** `/Users/mauricio/.openclaw/scripts/` (Global)
- **SKILLS:** `/Users/mauricio/.openclaw/workspace/skills/` (Global)
- **LOCAL WORKSPACE:** `/Users/mauricio/.openclaw/agents/main/workspace/` (Local - usar para arquivos de configuração e memória do agente)

---

## 📂 Google Drive — Estrutura de Pastas (NUNCA deixar arquivos na raiz!)

**REGRA ABSOLUTA:** Todo arquivo criado no Drive deve ir direto para a pasta correta. JAMAIS deixar solto na raiz (`My Drive`).

| Tipo de Arquivo | Pasta Destino | ID da Pasta |
|----------------|---------------|-------------|
| Resumos de reunião, relatórios Zoom, atas | **3. Reuniões \| Grupo US** | `1IVdKJxqeRezuM89amtmPdKp7B-sxRzlH` |
| Gravações Zoom (.mp4, .vtt) | **4. Zoom \| Gravações** | `1XqJe8Q8ExJFm72qIECDiTwC7fLlHbVPb` |
| Planilhas de leads, CRM, importações | **pasta Leads/CRM** (dentro de 1. Grupo US) | ver estrutura abaixo |
| Arquivos de TI / IA / automação | **10. TI / IA** | `1JTER2-FG2wjlJTXDM2c6oZ15PkUeUYjs` |
| Pesquisas e benchmarks | **5. Pesquisas** | `1SYpbU4prkKt71BDSBFnvcxxsGVjO0Pif` |
| Infra e configurações técnicas | **5. Infra** | `19ihwxatV75-9kq-MCn_mFl8wnvomtUyX` |
| AI / banco de dados | **5. AI Database** | `1VespmqjVQIj_qFTuAfBaxr3WE2QdQCER` |

**Quando criar arquivo no Drive:** sempre passar `--parent <ID>` ou mover logo após criar.
**Quando não souber a pasta certa:** perguntar ao Bruno antes de salvar na raiz.

---

## Quick Reference

### Delegação de Agentes (Orquestração)

```javascript
// Delegar para subagentes especializados
sessions_spawn(agentId="suporte", task="[contexto completo]")
sessions_spawn(agentId="cs", task="[contexto completo]")
sessions_spawn(agentId="coder", task="[contexto completo]")
```

### WhatsApp

```javascript
// Enviar mensagem
sendMessage(to="+5511999999999", message="Texto da mensagem")

// Ler mensagens recentes
getMessages(chat="+5511999999999", limit=10)
```

### Slack

```javascript
// Postar em canal
postMessage(channel="#canal", message="Texto")

// Postar em thread
postMessage(channel="#canal", thread_ts="1234567890.123456", message="Resposta")

// Ler mensagens
getMessages(channel="#canal", limit=20)
```

---

## ⚠️ TTS — REGRA OBRIGATÓRIA (NÃO MUDAR!)

- **Voz EXCLUSIVA para áudios:** `Raquel` (ElevenLabs, ID: `GDzHdQOi6jjf8zaXhCYD`)
- **NUNCA** usar outra voz (masculina ou qualquer outra).
- **SEMPRE** converter o áudio para **OGG Opus** antes de enviar no WhatsApp.
- Isso vale para leads, grupos ou qualquer envio de áudio.

---

## APIs Disponíveis

| Serviço | Uso | Como Acessar |
|---------|-----|--------------|
| **WhatsApp** | Receber/enviar msgs | Via OpenClaw gateway |
| **Slack** | Comunicação interna | Via OpenClaw gateway |
| **Google Calendar** | Verificar agenda | Via suporte ou gog-workspace |
| **Google Drive** | Buscar documentos | Via suporte |
| **Kiwify** | Verificar se é aluno, listar produtos | Script direto |

---

## Scripts Úteis

```bash
# Buscar produtos Kiwify
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py products

# Verificar se é aluno (por email)
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py search "email@exemplo.com"

# Buscar informação no RAG
python3 /Users/mauricio/.openclaw/workspace/skills/uds-search/scripts/uds-search.py search "termo"

# Testar conexão Google
node /Users/mauricio/.openclaw/scripts/test-google.js
```

---

## 🖥️ Dashboard Office — Status de Agentes em Tempo Real

### Quando spawnar um subagente → publicar status ACTIVE
```bash
SECRET="RffjoX6SmQFbXWOTfJVz9pn8ef8covsMVdByeO/rcpA="
curl -s -X POST https://laura.gpus.me/api/laura/sdr/agent-status \
  -H "x-laura-secret: $SECRET" -H "Content-Type: application/json" \
  -d '{"agentId":"coder","status":"active","currentAction":"Implementando feature X"}'
```

### Quando subagente concluir → publicar status IDLE
```bash
SECRET="RffjoX6SmQFbXWOTfJVz9pn8ef8covsMVdByeO/rcpA="
curl -s -X POST https://laura.gpus.me/api/laura/sdr/agent-status \
  -H "x-laura-secret: $SECRET" -H "Content-Type: application/json" \
  -d '{"agentId":"coder","status":"idle","currentAction":""}'
```

**Regra:** SEMPRE publicar status ao spawnar/completar subagentes. Isso alimenta o Office em tempo real.
Fazer em background (fire-and-forget) — não bloquear o fluxo principal.

---

## 📊 Dashboard SDR — Logging Obrigatório (laura.gpus.me/sdr)

### Quando passar lead para Lucas ou Erika → registrar handoff
```bash
NEON_DATABASE_URL="postgresql://neondb_owner:npg_P0ljy3pWNTYc@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb" \
node /Users/mauricio/.openclaw/scripts/log_lead_handoff.js \
  --action=insert \
  --phone="+5562..." \
  --name="Nome do Lead" \
  --product="TRINTAE3" \
  --closer_phone="+556195220319" \
  --closer_name="Lucas" \
  --notes="Lead qualificado, interesse em TRINTAE3"
```

### Quando uma objeção for tratada → salvar na memória
```bash
NEON_DATABASE_URL="..." node /Users/mauricio/.openclaw/skills/neondb-memories/index.js \
  --action=save_memory \
  --content="Lead +55... levantou objeção: 'tá caro'" \
  --metadata='{"type":"sdr_action","lead":"+55...","objection":"preço alto","action":"objection_handled"}'
```

---

## 🔗 Links de Venda

| Produto | Link |
|---------|------|
| **COMU US** | https://pay.kiwify.com.br/YDb0Mmy |
| **Aurículo** | https://pay.kiwify.com.br/NLJ62nO |

> ⚠️ TRINTAE3, NEON e OTB **não têm link direto** — sempre coletar email e encaminhar para closer.

---

## MCPs Disponíveis

| MCP | Uso |
|-----|-----|
| **sessions** | Gerenciar sessões de agentes (spawn, status) |
| **whatsapp** | Integração WhatsApp |
| **slack** | Integração Slack |

---

## Contatos Importantes

| Quem | Contato | Quando |
|------|---------|--------|
| **Maurício (Master)** | +5562999776996 | Escalonamentos urgentes |
| **Lucas (Closer)** | +556195220319 | Leads qualificados para call |
| **Erika (Closer)** | +556299438005 | Leads qualificados para call |
| **Financeiro** | #financeiro (Slack) | Pagamentos, reembolsos |
| **Equipe** | #geral (Slack) | Comunicação interna |

---

## Skills Disponíveis

### uds-search (Busca Unificada)
**Path:** `/Users/mauricio/.openclaw/workspace/skills/uds-search/SKILL.md`

**Usar para:**
- Buscar QUALQUER informação (Drive, Notion, Kiwify)
- Lookup de leads, produtos, vendas
- Encontrar documentos internos

> **REGRA:** Para qualquer busca de informação, SEMPRE começar pelo UDS.

**Comandos:**
```bash
# Busca híbrida (padrão)
python3 /Users/mauricio/.openclaw/workspace/skills/uds-search/scripts/uds-search.py search "termo"

# API direta
curl -s -X POST http://localhost:8000/search \
  -H 'Content-Type: application/json' \
  -d '{"query": "termo", "top_k": 10}' | python3 -m json.tool
```

### neondb-tasks (Dashboard de Tasks)
**Path:** `/Users/mauricio/.openclaw/skills/neondb-tasks/SKILL.md`

**Usar para:**
- Criar/atualizar tasks e subtasks no Dashboard
- Reportar progresso de atividades
- **Agent ID:** sempre usar `main`

### neondb-memories (Memórias NeonDB)
**Path:** `/Users/mauricio/.openclaw/skills/neondb-memories/SKILL.md`

**Usar para:**
- Salvar/buscar memórias de conversas no NeonDB
- Histórico de interações com leads e clientes

### proactive-agent
**Path:** `/Users/mauricio/.openclaw/workspace/skills/proactive-agent/SKILL.md`

**Usar para:**
- Limites de contexto e cron jobs
- Gestão de heartbeats


### zoom
**Path:** `/Users/mauricio/.openclaw/workspace/skills/zoom/SKILL.md`

**Usar para:**
- Criar link de reunião para call de qualificação
- Listar reuniões agendadas

**Comandos:**
```bash
# Criar reunião
python3 /Users/mauricio/.openclaw/scripts/zoom_cli.py create-meeting "Call Qualificação" "2026-02-05T10:00:00" 30

# Listar reuniões
python3 /Users/mauricio/.openclaw/scripts/zoom_cli.py list-meetings
```

### voice-calling
**Path:** `/Users/mauricio/.openclaw/workspace/skills/voice-calling/SKILL.md`

**Usar para:**
- Ligações outbound para leads
- Follow-up por voz

**Comandos:**
```bash
# Fazer ligação
node /Users/mauricio/.openclaw/scripts/voice/outbound-caller.js call +5562999999999 "Maria" "TRINTAE3"

# Checar status
node /Users/mauricio/.openclaw/scripts/voice/outbound-caller.js status
```

---

## Paths Importantes

| Path | Descrição |
|------|-----------|
| `/Users/mauricio/.openclaw/agents/` | Configs dos agentes |
| `/Users/mauricio/.openclaw/scripts/` | Scripts de automação |
| `/Users/mauricio/.openclaw/workspace/skills/` | Skills disponíveis |
| `~/.openclaw/` | Config do OpenClaw |

---

## 📋 Content Pipeline — Criar card via API

```bash
SECRET="RffjoX6SmQFbXWOTfJVz9pn8ef8covsMVdByeO/rcpA="
curl -s -X POST https://laura.gpus.me/api/laura/content/card \
  -H "x-laura-secret: $SECRET" -H "Content-Type: application/json" \
  -d '{"title":"Nome do conteúdo","description":"...","stage":"ideas","assignedTo":"rafa","createdBy":"celso","tags":["marketing"]}'
```

Stages válidos: `ideas` → `roteiro` → `thumbnail` → `gravacao` → `edicao` → `publicado`

O card aparece automaticamente no Kanban em `/content` via SSE real-time.

---

*Última atualização: 2026-02-26*
