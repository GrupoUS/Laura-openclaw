# TOOLS.md - Suporte Geral Interno

## Linear MCP (via mcporter)

### Configuration

| Key | Value |
|-----|-------|
| **Workspace** | GPUS |
| **Team ID** | `6a0fb0e7-399a-4b7a-91e5-943e5d6017bf` |
| **Team Key** | `GPU` |
| **Project ID** | `7d85ccae-68fc-4a9b-bbcd-e54e394d4f0e` |
| **Project Name** | Benício |
| **Project URL** | https://linear.app/gpus/project/benicio-7aa0c62c6da4 |
| **MCP Server** | `@mseep/linear-mcp` via mcporter |

---

## Workflow States (UUIDs obrigatórios)

> **IMPORTANTE:** O `update_issue` requer state UUIDs, não texto.

| State | UUID | Descrição |
|-------|------|-----------|
| **Backlog** | `25ff79da-e1a3-4d7d-937b-92fef2802fac` | Planejado mas não pronto |
| **Todo** | `54c01d00-aa5b-4a55-a648-cb89e20177a7` | Pronto para iniciar |
| **In Progress** | `29f11d75-12ba-4469-a011-15047f9e7e91` | Em execução |
| **In Review** | `77fb9267-983c-47ab-8721-2fc6259578a2` | Aguardando revisão |
| **Done** | `d626a88f-e52b-4af0-be5b-bc40620f4eb0` | Concluído |
| **Canceled** | `79b04cb2-2319-4a38-a306-8993b4a902cd` | Cancelado |

---

## Linear Tools (7 total)

| Tool | Description |
|------|-------------|
| `create_issue` | Criar nova issue |
| `update_issue` | Atualizar issue existente |
| `get_issue` | Ver detalhes de uma issue |
| `list_issues` | Listar issues com filtros |
| `search_issues` | Buscar issues por texto |
| `list_teams` | Listar times do workspace |
| `list_projects` | Listar projetos |

---

## Quick Reference — Comandos Essenciais

### Linear

```bash
# Criar Issue
mcporter call linear create_issue \
  teamId=6a0fb0e7-399a-4b7a-91e5-943e5d6017bf \
  title="[Feature] Descrição clara" \
  description="Detalhes em markdown" \
  priority=3

# Atualizar para In Progress
mcporter call linear update_issue \
  issueId=<issue_id> \
  status=29f11d75-12ba-4469-a011-15047f9e7e91

# Marcar como Done
mcporter call linear update_issue \
  issueId=<issue_id> \
  status=d626a88f-e52b-4af0-be5b-bc40620f4eb0

# Buscar Issues
mcporter call linear search_issues query="termo" first=10
```

### Google Workspace (gog)

```bash
# Ver agenda
gog calendar events --all --today --json
gog calendar events --all --week --json

# Gmail
gog gmail search 'newer_than:7d' --max 10 --json
gog gmail send --to email@example.com --subject "..." --body "..."

# Drive
gog drive search "termo" --max 10 --json

# Sheets
gog sheets get <sheetId> "Tab!A1:D10" --json
```

### Kiwify (Real-time)

```bash
# Buscar aluno por email ou telefone (API real-time)
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py search "email@exemplo.com"
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py products
```

### UDS Search (Drive + Notion + Kiwify — busca unificada)

```bash
# Busca híbrida (BM25 + vector) — USAR COMO PADRÃO
python3 /Users/mauricio/.openclaw/skills/uds-search/scripts/uds-search.py "termo de busca"

# Busca por keyword exato
python3 /Users/mauricio/.openclaw/skills/uds-search/scripts/uds-search.py "nome exato" --type bm25

# Busca semântica (conceitual)
python3 /Users/mauricio/.openclaw/skills/uds-search/scripts/uds-search.py "como funciona MBA" --type vector

# Ver status do índice
python3 /Users/mauricio/.openclaw/skills/uds-search/scripts/uds-search.py --status

# Via curl (alternativa)
curl -s -X POST http://localhost:8000/search \
  -H 'Content-Type: application/json' \
  -d '{"query": "termo", "top_k": 10}' | python3 -m json.tool
```

### Zoom

```bash
# Listar reuniões
python3 /Users/mauricio/.openclaw/scripts/zoom_cli.py list-meetings

# Criar reunião
python3 /Users/mauricio/.openclaw/scripts/zoom_cli.py create-meeting "Reunião" "2026-02-15T10:00:00" 60

# Resumo de reunião (AI Companion)
python3 /Users/mauricio/.openclaw/scripts/zoom_cli.py get-summary <meetingId>
```

### Testar Conexão Google

```bash
node /Users/mauricio/.openclaw/scripts/test-google.js
```

---

## Pastas Importantes (Drive)

| Pasta | ID | Uso |
|-------|----|-----|
| **Exportação Kiwify** | `1i4CCfdMeQ2cafR73FIpDFMF-Xhdo-fA0` | Relatórios exportados |
| **Alunos Grupo US** | `1m0i53TKiGHtCC05zRKEc-snhyBZnmX75` | Dados de alunos por produto |
| **Documentos (RAG)** | `1VlwI4ogZQx8QOoGr69ug5TF-bErTTNFc` | Base de conhecimento |

---

## Skills Disponíveis

### linear-planner
**Path:** `/Users/mauricio/.openclaw/skills/linear-planner/SKILL.md`

**Usar para:**
- Tracking de tasks no Linear (Projeto Benício)
- Decomposição em subtasks atômicas

### planning
**Path:** `/Users/mauricio/.openclaw/skills/planning/SKILL.md`

**Usar para:**
- Planejamento R.P.I.V (Research → Plan → Implement → Validate)
- Criar PRPs (Project Requirement Plans)

### gog-workspace (Google Workspace)
**Path:** `/Users/mauricio/.openclaw/skills/gog-workspace/SKILL.md`

**Usar para:**
- Gerenciar agenda do time
- Enviar emails de cobrança/follow-up
- Buscar documentos no Drive
- Ler/escrever planilhas

### zoom
**Path:** `/Users/mauricio/.openclaw/skills/zoom/SKILL.md`

**Usar para:**
- Gerar resumos de reuniões (AI Companion)
- Criar reuniões
- Extrair action items de calls

### uds-search (Busca Unificada)
**Path:** `/Users/mauricio/.openclaw/skills/uds-search/SKILL.md`

**Usar para:**
- Buscar QUALQUER informação (Drive, Notion, Kiwify)
- Lookup de alunos, produtos, vendas
- Encontrar documentos internos
- Responder perguntas que precisam de dados da empresa

> **REGRA:** Para qualquer busca de informação, SEMPRE começar pelo UDS.
> Usar Kiwify API direta apenas para dados real-time de vendas.

### notion
**Path:** `/Users/mauricio/.openclaw/skills/notion/SKILL.md`

**Usar para:**
- Acompanhar tarefas no Notion
- Extrair status e deadlines
- Sync databases para outros sistemas

---

## Contatos para Escalação

| Quem | Contato | Quando |
|------|---------|--------|
| **Maurício** | +5562999776996 | Decisões estratégicas |
| **Bruno** | Slack | Tarefas sem dono, operacional |
| **Raquel** | Slack | Coordenação pedagógica |
| **Financeiro** | #financeiro (Slack) | Pagamento, reembolso |

---

## Scripts Úteis

| Script | Uso |
|--------|-----|
| `/Users/mauricio/.openclaw/scripts/kiwify.js` | API Kiwify (real-time) |
| `/Users/mauricio/.openclaw/skills/uds-search/scripts/uds-search.py` | Busca unificada UDS |
| `/Users/mauricio/.openclaw/scripts/google-services.js` | Google Workspace |
| `/Users/mauricio/.openclaw/scripts/zoom.js` | Zoom API |
| `/Users/mauricio/.openclaw/scripts/test-google.js` | Testar conexão |

---

## Referências

- **Config mcporter:** `~/.mcporter/mcporter.json`
- **Skill Linear:** `/Users/mauricio/.openclaw/skills/linear-planner/SKILL.md`
- **Integração:** `/Users/mauricio/.openclaw/skills/linear-planner/references/linear-integration.md`

---

*Última atualização: 2026-02-14*
