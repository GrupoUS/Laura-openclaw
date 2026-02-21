# TOOLS.md - Coordinator (Laura)

## Quick Reference

### Delegação de Agentes

```javascript
// Delegar para subagente
sessions_spawn(agentId="sdr", task="[contexto completo]")
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

## APIs Disponíveis

| Serviço | Uso | Como Acessar |
|---------|-----|--------------|
| **WhatsApp** | Receber/enviar msgs | Via OpenClaw gateway |
| **Slack** | Comunicação interna | Via OpenClaw gateway |
| **Google Calendar** | Verificar agenda | Via suporte |
| **Google Drive** | Buscar documentos | Via suporte |
| **Kiwify** | Verificar se é aluno | Script direto ou via suporte |

---

## Scripts Úteis

```bash
# Verificar se é aluno (delegar para suporte se precisar)
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py search "email@exemplo.com"

# Testar conexão Google
node /Users/mauricio/.openclaw/scripts/test-google.js
```

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
| **Financeiro** | #financeiro (Slack) | Pagamentos, reembolsos |
| **Equipe** | #geral (Slack) | Comunicação interna |

---

## Paths Importantes

| Path | Descrição |
|------|-----------|
| `/Users/mauricio/.openclaw/agents/` | Configs dos agentes |
| `/Users/mauricio/.openclaw/scripts/` | Scripts de automação |
| `/Users/mauricio/.openclaw/workspace/skills/` | Skills disponíveis |
| `~/.openclaw/` | Config do OpenClaw |

---

## Skills Disponíveis

### gog-workspace (Google Workspace)
**Path:** `/Users/mauricio/.openclaw/workspace/skills/gog-workspace/SKILL.md`

**Usar para:**
- Verificar agenda geral (disponibilidade)
- Buscar contatos

**Comandos principais:**
```bash
# Ver agenda de hoje
gog calendar events --all --today --json

# Buscar eventos da semana
gog calendar events --all --week --json
```

---

*Última atualização: 2026-02-03*

