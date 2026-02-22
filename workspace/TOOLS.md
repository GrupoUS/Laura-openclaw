# TOOLS.md - Ferramentas Compartilhadas (Grupo US)

## 🔗 Links Rápidos
- **Slack Grupo US:** https://join.slack.com/t/grupo-us/shared_invite/zt-3n7csiejb

---

## 📡 Integrações Ativas

### Google Workspace
- **Conta:** suporte@drasacha.com.br
- **Serviços:** Gmail, Calendar, Drive, Sheets, Places
- **Skill:** `skills/gog-workspace/SKILL.md`
- **Calendários:** GRUPO US, TRINTAE3, COMU US, NEON, OTB

```bash
# Via skill gog
gog calendar events --all --today --json
gog gmail search 'newer_than:7d' --max 10 --json
gog drive search "termo" --max 10 --json
gog sheets get <sheetId> "Tab!A1:D10" --json
```

### Kiwify (Alunos & Vendas)
- **Config:** `/Users/mauricio/.openclaw/config/kiwify.json`
- **Script:** `/Users/mauricio/.openclaw/scripts/kiwify_cli.py`

```bash
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py products
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py sales
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py search "email@exemplo.com"
```

### Zoom
- **Config:** `/Users/mauricio/.openclaw/config/zoom.json`
- **Skill:** `skills/zoom/SKILL.md`

```bash
python3 /Users/mauricio/.openclaw/scripts/zoom_cli.py list-meetings
python3 /Users/mauricio/.openclaw/scripts/zoom_cli.py create-meeting "<titulo>" "<data>" <duracao>
python3 /Users/mauricio/.openclaw/scripts/zoom_cli.py get-summary <meetingId>
```

### Notion
- **API Key:** `~/.config/notion/api_key`
- **Skill:** `skills/notion/SKILL.md`

### Linear
- **API Key:** `~/.config/linear/api_key`
- **Skill:** `skills/linear-planner/SKILL.md`

### Agent Browser
- **CLI:** `agent-browser`
- **Skill:** `skills/agent-browser/SKILL.md`

```bash
agent-browser goto "https://example.com"
agent-browser snapshot -i --json
agent-browser click @e1
agent-browser fill @e2 "texto"
agent-browser screenshot output.png
```

---

## 🔍 Busca de Informações (UDS)

**REGRA:** SEMPRE buscar no UDS antes de responder sobre empresa, alunos, produtos.

```bash
# Busca híbrida (padrão)
python3 /Users/mauricio/.openclaw/workspace/skills/uds-search/scripts/uds-search.py search "termo"

# API direta
curl -s -X POST http://localhost:8000/search \
  -H 'Content-Type: application/json' \
  -d '{"query": "termo", "top_k": 10}' | python3 -m json.tool
```

- **Backend:** PostgreSQL 17 + pgvector + busca híbrida (BM25 + vector + RRF)
- **Fontes:** Google Drive (10.978 arquivos), Notion
- **Qdrant:** http://31.97.170.4:6333 (collections: grupous_drive, grupous_notion)

---

## 📞 Agendamento de Calls (SDR → Closer)

- **Script:** `/Users/mauricio/.openclaw/scripts/schedule-call.js`
- **Closer:** Lucas (+556195220319) / Erika (+556299438005)
- **Calendário:** GRUPO US
- **Conta:** suporte@drasacha.com.br

```bash
node scripts/schedule-call.js criar "<nome>" "<telefone>" "<email>" "<dataHora>" "<produto>"
node scripts/schedule-call.js horarios 2026-01-30
node scripts/schedule-call.js test
```

---

## 🎙️ Voice & Áudio

### TTS (Text-to-Speech)
- **Voz EXCLUSIVA:** `Raquel` (ElevenLabs, skill `sag`)
- **NUNCA** usar outra voz. **SEMPRE** converter para OGG Opus no WhatsApp.

### Voice Call Plugin
```bash
openclaw voicecall call --to "+5562999999999" --message "Olá"
openclaw voicecall status --call-id <id>
openclaw voicecall end --call-id <id>
```

### Transcrição
```bash
node /Users/mauricio/.openclaw/scripts/transcribe.js <arquivo_audio>
```

### Voice Calling (Outbound)
- **Skill:** `skills/voice-calling/SKILL.md`
```bash
node /Users/mauricio/.openclaw/scripts/voice/outbound-caller.js call +5562999999999 "Nome" "TRINTAE3"
node /Users/mauricio/.openclaw/scripts/voice/outbound-caller.js status
```

---

## 🖼️ Geração de Imagens
- **Skill:** `skills/nano-banana-pro/SKILL.md`

```bash
uv run /Users/mauricio/.openclaw/workspace/skills/nano-banana-pro/scripts/generate_image.py \
  --prompt "descrição" --filename "output.png" --resolution 4K
```

---

## 🏗️ VPS / Infraestrutura

| Item | Valor |
|------|-------|
| **Domínio** | vps.gpus.me |
| **IP** | 31.97.170.4 |
| **Provider** | Hostinger |
| **OS** | Ubuntu 24.04 + Docker |

---

## 📁 Google Drive - Pastas Importantes

| Pasta | ID | Uso |
|-------|----|-----|
| **Exportação Kiwify** | `1i4CCfdMeQ2cafR73FIpDFMF-Xhdo-fA0` | Dados de alunos |
| **Alunos Grupo US** | `1m0i53TKiGHtCC05zRKEc-snhyBZnmX75` | Pastas individuais por produto |
| **Documentos (RAG)** | `1VlwI4ogZQx8QOoGr69ug5TF-bErTTNFc` | Base de conhecimento geral |
| **Mentorados NEON** | `1gp048ac6i47AKL4vGzBD-RoAi43FoXkJ` | Acompanhamento NEON |

---

## 🧩 Skills Compartilhadas (Workspace)

Skills em `/Users/mauricio/.openclaw/workspace/skills/`:

| Skill | Uso |
|-------|-----|
| `uds-search` | Busca unificada (Drive + Notion + Kiwify) |
| `gog-workspace` | Google Workspace (Calendar, Gmail, Drive, Sheets) |
| `zoom` | Zoom API (reuniões, resumos) |
| `voice-calling` | Ligações outbound |
| `nano-banana-pro` | Geração de imagens (Gemini) |
| `notion` | Notion API |
| `linear-planner` | Linear (tracking de issues) |
| `agent-browser` | Browser automation |
| `opencode-acp-control` | OpenCode via ACP |
| `proactive-agent` | Heartbeats e cron jobs |
| `capability-evolver` | Self-healing |
| `systematic-debugging` | Debug estruturado |
| `planning` | Planejamento R.P.I.V |
| `skill-creator` | Criar novas skills |
| `find-skills` | Descobrir skills disponíveis |

Skills em `/Users/mauricio/.openclaw/skills/` (managed):

| Skill | Uso |
|-------|-----|
| `neondb-tasks` | Dashboard de tasks |
| `neondb-memories` | Memórias no NeonDB |

---

## 📎 Paths Importantes

| Path | Descrição |
|------|-----------|
| `/Users/mauricio/.openclaw/agents/` | Workspaces dos agentes |
| `/Users/mauricio/.openclaw/scripts/` | Scripts de automação |
| `/Users/mauricio/.openclaw/config/` | Credenciais e configs |
| `/Users/mauricio/.openclaw/workspace/skills/` | Skills compartilhadas |
| `/Users/mauricio/.openclaw/alunos/` | Base de alunos |

---

*Última atualização: 2026-02-22*
