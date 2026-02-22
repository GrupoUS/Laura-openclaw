# TOOLS.md - Laura | Chat-SDR-Orquestradora

## 📍 Fontes de Recursos
- **SCRIPTS:** `/Users/mauricio/.openclaw/scripts/` (Global)
- **SKILLS:** `/Users/mauricio/.openclaw/workspace/skills/` (Global)
- **LOCAL WORKSPACE:** `/Users/mauricio/.openclaw/agents/main/workspace/` (Local - usar para arquivos de configuração e memória do agente)

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

### capability-evolver
**Path:** `/Users/mauricio/.openclaw/workspace/skills/capability-evolver/SKILL.md`

**Usar para:**
- Self-healing após falhas graves
- Evolução contínua das capabilities

**Usar para:**
- Verificar agenda do closer (disponibilidade)
- Enviar email de confirmação de reunião
- Buscar contatos

**Comandos principais:**
```bash
# Ver agenda de hoje
gog calendar events --all --today --json

# Buscar eventos da semana
gog calendar events --all --week --json

# Enviar email (PEDIR CONFIRMAÇÃO)
gog gmail send --to lead@email.com --subject "Confirmação de Call" --body "..."
```

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

*Última atualização: 2026-02-22*
