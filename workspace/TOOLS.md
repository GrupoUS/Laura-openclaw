- Slack Grupo US | Link de Convite: https://join.slack.com/t/grupo-us/shared_invite/zt-3n7csiejb-YMDm3zBNzaG6325O7oK7qA

---

---

## CLI Tools & Integrações

### Google Workspace (MCP)
- **Status:** ✅ Conectado (suporte@drasacha.com.br)
- **Server:** `google-workspace`
- **Ferramenta:** `mcporter`
- **Regra:** Usar `mcporter call google-workspace.<tool>` para todas as interações (Gmail, Calendar, Drive).
- **Não usar:** `gog` CLI (não configurado/autenticado neste ambiente).

### Zoom
- **Status:** ✅ Conectado
- **Script:** `scripts/zoom_cli.py`
- **Config:** `config/zoom.json`
- **Comandos:**
  ```bash
  python3 scripts/zoom_cli.py list-meetings
  python3 scripts/zoom_cli.py create-meeting "<titulo>" "<data>" <duracao>
  python3 scripts/zoom_cli.py get-meeting <meetingId>
  python3 scripts/zoom_cli.py get-summary <meetingId>
  ```

### Notion
- **Status:** ✅ Conectado
- **API Key:** `~/.config/notion/api_key`
- **MCP Server:** Disponível via notion-mcp-server
- **Skill:** `skills/notion/` com script `json_to_markdown.py`

### Linear
- **Status:** ✅ Configurado
- **API Key:** `~/.config/linear/api_key`
- **MCP Config:** `config/mcporter.json` (server: linear)
- **Comandos via MCP:**
  - Criar issues, listar projetos, buscar tarefas
  - Trigger: Perguntas sobre Linear, tarefas, issues

### Agent Browser (Vercel Labs)
- **Status:** ✅ Instalado
- **CLI:** `agent-browser`
- **Browser:** Chromium 145 (`~/.cache/ms-playwright/chromium-1208`)
- **Comandos:**
  ```bash
  # Navegar e capturar snapshot
  agent-browser goto "https://example.com"
  agent-browser snapshot

  # Clicar em elemento
  agent-browser click "Login button"

  # Preencher campo
  agent-browser type "email field" "user@example.com"

  # Screenshot
  agent-browser screenshot output.png
  ```
- **Uso com AI:** Agent pode usar para automação de browser

---

## Agendamento de Calls (SDR → Closer)
- **Script:** `/Users/mauricio/.openclaw/scripts/schedule-call.js`
- **Closer:** Lucas (+556195220319)
- **Calendário Oficial de Calls:** 6151819ee9149a381f72c5c3ddffeb31b85cdf25a69f475d95740603f97e52ec@group.calendar.google.com (GRUPO US)
- **Conta Base:** suporte@drasacha.com.br

### Comandos
```bash
# Criar evento
node scripts/schedule-call.js criar "<nome>" "<telefone>" "<email>" "<dataHora>" "<produto>"
# Exemplo:
node scripts/schedule-call.js criar "Maria Silva" "+5511999999999" "maria@email.com" "2026-01-30T14:00:00" "TRINTAE3"

# Ver horários ocupados
node scripts/schedule-call.js horarios 2026-01-30

# Testar conexão
node scripts/schedule-call.js test
```

---

## Busca Vetorial RAG
**SEMPRE usar para informações sobre empresa, alunos, projetos.**

### Buscar
```bash
python3 /Users/mauricio/.openclaw/workspace/skills/uds-search/scripts/uds-search.py search "termo"
```

### Qdrant
- **URL:** http://31.97.170.4:6333
- **Collections:** grupous_drive, grupous_notion

---

---

## Google Workspace
- **Conta:** suporte@drasacha.com.br
- **Método Principal:** `mcporter` (MCP Server)
- **Calendários:** GRUPO US, TRINTAE3, COMU US, NEON, OTB

## Kiwify (Alunos e Vendas)
- **Account ID:** hRsfEMMkkwZELXF
- **Config:** `/Users/mauricio/.openclaw/config/kiwify.json`
- **Script:** `/Users/mauricio/.openclaw/scripts/kiwify_cli.py`

### Comandos úteis
```bash
# Listar produtos
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py products

# Listar vendas recentes (30 dias)
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py sales

# Buscar aluno por email ou telefone
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py search "email@exemplo.com"
```

### Produtos disponíveis na Kiwify
- 🥝 Mentoria e Pós TRINTAE3
- 🥝 Neon
- 🥝 OTB - Out of The Box
- 🥝 Comunidade US
- 🥝 Curso de Auriculo
- O Mapa da Clínica Escalável

## Google Places
- **API Key:** AIzaSyDH5HiJWMdVyKCtfFqMs3nZR0IPYJtpDcA
- **CLI:** goplaces

### Comandos úteis
```bash
# Buscar locais
GOOGLE_PLACES_API_KEY=AIzaSyDH5HiJWMdVyKCtfFqMs3nZR0IPYJtpDcA goplaces search "clínicas em Goiânia"
```

## Gemini (Geração de Imagens)
- **API Key:** AIzaSyCl39UHQTiRoc_iyhhHwtn7oYdbvgt7F04
- **Skill:** nano-banana-pro

## VPS
- **Domínio:** vps.gpus.me
- **IP:** 31.97.170.4
- **Provider:** Hostinger
- **OS:** Ubuntu 24.04 with Docker

## Qdrant (Busca Vetorial)
- **URL:** http://31.97.170.4:6333
- **Collection:** grupous_drive
- **Uso:** RAG para buscar documentos do Google Drive

### Comandos Qdrant (Universal Data System)
```bash
# Buscar documentos via UDS
python3 /Users/mauricio/.openclaw/workspace/skills/uds-search/scripts/uds-search.py search "termo de busca"
```

## Notion
- **API Key:** ~/.config/notion/api_key
- **Versão API:** 2025-09-03
- **Status:** ✅ Conectado

### Páginas/Databases encontrados
- Central de projetos | Grupo Us
- Atividades de projetos
- Posts para redes sociais

### Comandos úteis
```bash
# Buscar no Notion
NOTION_KEY=$(cat ~/.config/notion/api_key)
curl -X POST "https://api.notion.com/v1/search" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{"query": "termo"}'
```

---

## Transcrição de Áudio
- **Script:** `/Users/mauricio/.openclaw/scripts/transcribe.js`
- **API:** Google Gemini 2.5 Flash
- **Uso:** `node /Users/mauricio/.openclaw/scripts/transcribe.js <arquivo_audio>`
- **Formatos suportados:** ogg, mp3, wav, m4a, webm, flac

## Google Drive - Pastas Importantes

### Exportação Kiwify (Dados de Alunos e Progresso)
- **URL:** https://drive.google.com/drive/folders/1i4CCfdMeQ2cafR73FIpDFMF-Xhdo-fA0
- **Folder ID:** 1i4CCfdMeQ2cafR73FIpDFMF-Xhdo-fA0
- **Uso:** Dados de exportação da Kiwify com progresso de aulas, engajamento, turmas
- **IMPORTANTE:** Sempre buscar dados de alunos aqui primeiro!

### Alunos Grupo US
- **URL:** https://drive.google.com/drive/folders/1m0i53TKiGHtCC05zRKEc-snhyBZnmX75
- **Uso:** Pastas individuais por produto e por aluno
- **Regra:** Buscar primeiro na API Kiwify, depois no Drive
- **Se aluno interagir:** Procurar pasta dele; se não existir, criar e alimentar com dados coletados

### Pasta Principal de Documentos (RAG)
- **URL:** https://drive.google.com/drive/folders/1VlwI4ogZQx8QOoGr69ug5TF-bErTTNFc
- **Folder ID:** 1VlwI4ogZQx8QOoGr69ug5TF-bErTTNFc
- **Uso:** Documentos gerais do Grupo US para indexação vetorial

## Voice Call Plugin (Ligação por Voz)

**Aviso:** O plugin requer configuração prévia correta no Twilio/Voximplant (presente em `config/telephony.json`). O Gateway interage com a porta habilitada no `OpenClaw Voice Server` (por padrão `3001`).

### OpenClaw Agent Tool
O agent pode usar a tool `voice_call` nativamente. O schema inclui:
- `initiate_call (message, to?, mode?)`: Inicia uma ligação.
- `continue_call (callId, message)`: Continua.
- `speak_to_user (callId, message)`: Fala.
- `end_call (callId)`: Encerra.
- `get_status (callId)`: Status da chamada.

### OpenClaw CLI Commands
```bash
openclaw voicecall call --to "+5562999999999" --message "Olá do OpenClaw"
openclaw voicecall continue --call-id <id> --message "Alguma dúvida?"
openclaw voicecall speak --call-id <id> --message "Um momento"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall expose --mode funnel
```

### Gateway RPC Commands
A API RPC do Gateway aceita os seguintes endpoints:
- `voicecall.initiate`
- `voicecall.continue`
- `voicecall.speak`
- `voicecall.end`
- `voicecall.status`

### Scripts Internos Locais
Para invocar manualmente via Node.js sem o OpenClaw Gateway CLI:
```bash
# Ligar diretamente manual
node /Users/mauricio/.openclaw/scripts/voice/outbound-caller.js call +5562999999999 "Maria Silva" "TRINTAE3"

# Processar fila de Leads
node /Users/mauricio/.openclaw/scripts/voice/outbound-caller.js queue

# Ver status da integração, fila e business hours
node /Users/mauricio/.openclaw/scripts/voice/outbound-caller.js status

# Testar se a Telefonia está autenticando
node /Users/mauricio/.openclaw/scripts/voice/telephony.js
```

## Arquivos Importantes
- Token Google: `/Users/mauricio/.openclaw/config/google-token.json`
- Config Kiwify: `/Users/mauricio/.openclaw/config/kiwify.json`
- Credenciais Google: `/Users/mauricio/.openclaw/config/google-credentials.json`
