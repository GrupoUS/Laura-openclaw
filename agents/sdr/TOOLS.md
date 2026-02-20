# TOOLS.md - SDR (Laura Pré-Vendas)

## Quick Reference

### Buscar Produtos
```bash
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py products
```

### Buscar Lead/Aluno
```bash
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py search "email@exemplo.com"
```

### Buscar Informação no RAG
```bash
python3 /Users/mauricio/.openclaw/skills/uds-search/scripts/uds-search.py search "termo"
```

---

## APIs Disponíveis

| Serviço | Uso | Como Acessar |
|---------|-----|--------------|
| **Kiwify** | Produtos, verificar se é aluno | Script kiwify.js |
| **Google Calendar** | Verificar disponibilidade | Via assistant |
| **WhatsApp** | Receber/enviar mensagens | Via OpenClaw gateway |

---

## Links de Venda

| Produto | Link |
|---------|------|
| **COMU US** | https://pay.kiwify.com.br/YDb0Mmy |
| **Aurículo** | https://pay.kiwify.com.br/NLJ62nO |

> ⚠️ TRINTAE3, NEON e OTB **não têm link direto** — sempre coletar email e encaminhar para closer.

---

## Contatos Importantes

| Quem | Contato | Quando |
|------|---------|--------|
| **Lucas (Closer)** | +556195220319 | Leads qualificados para call |
| **Maurício** | +5562999776996 | Escalonamentos urgentes |

---

## Scripts Úteis

| Script | Uso |
|--------|-----|
| `/Users/mauricio/.openclaw/scripts/kiwify.js` | API Kiwify |
| `/Users/mauricio/.openclaw/scripts/rag-search.js` | Busca vetorial |
| `/Users/mauricio/.openclaw/scripts/google-services.js` | Google Workspace |

---

## Skills Disponíveis

### gog-workspace (Google Workspace)
**Path:** `/Users/mauricio/.openclaw/skills/gog-workspace/SKILL.md`

**Usar para:**
- Verificar agenda do closer (disponibilidade)
- Enviar email de confirmação de reunião
- Buscar contatos

**Comandos principais:**
```bash
# Ver agenda de hoje
gog calendar events --all --today --json

# Buscar reuniões da semana
gog calendar events --all --week --json

# Enviar email (PEDIR CONFIRMAÇÃO)
gog gmail send --to lead@email.com --subject "Confirmação de Call" --body "..."
```

### zoom
**Path:** `/Users/mauricio/.openclaw/skills/zoom/SKILL.md`

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
**Path:** `/Users/mauricio/.openclaw/skills/voice-calling/SKILL.md`

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

*Última atualização: 2026-02-03*

