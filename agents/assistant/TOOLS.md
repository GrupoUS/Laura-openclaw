# TOOLS.md - Linear Configuration

Configuração do Linear MCP para rastreamento de tarefas no Projeto Benício.

---

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

## Available Tools (7 total)

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

## Comandos Essenciais

### Criar Issue

```bash
mcporter call linear create_issue \
  teamId=6a0fb0e7-399a-4b7a-91e5-943e5d6017bf \
  title="[Feature] Descrição clara" \
  description="Detalhes em markdown" \
  priority=3
```

**Priority:** 0=None, 1=Urgent, 2=High, 3=Normal, 4=Low

### Listar Issues

```bash
# Listar do time
mcporter call linear list_issues \
  teamId=6a0fb0e7-399a-4b7a-91e5-943e5d6017bf \
  first=20
```

### Atualizar Status

```bash
# Set to In Progress
mcporter call linear update_issue \
  issueId=<issue_id> \
  status=29f11d75-12ba-4469-a011-15047f9e7e91

# Set to Done
mcporter call linear update_issue \
  issueId=<issue_id> \
  status=d626a88f-e52b-4af0-be5b-bc40620f4eb0
```

### Buscar Issues

```bash
mcporter call linear search_issues query="termo" first=10
```

### Ver Detalhes

```bash
mcporter call linear get_issue issueId=<issue_id>
```

---

## Workflow Típico

```bash
# 1. Criar issue
mcporter call linear create_issue \
  teamId=6a0fb0e7-399a-4b7a-91e5-943e5d6017bf \
  title="[Feature] Tarefa exemplo" \
  description="Descrição da tarefa" \
  priority=3

# 2. Capturar o ID da resposta e atualizar para In Progress
mcporter call linear update_issue \
  issueId=<id_da_issue> \
  status=29f11d75-12ba-4469-a011-15047f9e7e91

# 3. Ao concluir, marcar como Done
mcporter call linear update_issue \
  issueId=<id_da_issue> \
  status=d626a88f-e52b-4af0-be5b-bc40620f4eb0
```

---

## Priority Values

| Valor | Significado |
|-------|-------------|
| 0 | None |
| 1 | 🔴 Urgent |
| 2 | 🟠 High |
| 3 | 🟡 Normal (default) |
| 4 | 🟢 Low |

---

## Size Markers (para títulos)

| Marker | Tempo | Exemplos |
|--------|-------|----------|
| **[S]** | < 30 min | Buscar dados, formatar texto |
| **[M]** | 1-3 horas | Criar relatório, integrar API |
| **[L]** | 3-8 horas | Implementar feature completa |

---

## Type Prefixes (para títulos)

| Prefix | Uso |
|--------|-----|
| `[Feature]` | Nova funcionalidade |
| `[Bug]` | Corrigir problema |
| `[Chore]` | Manutenção |
| `[Research]` | Investigação |
| `[Docs]` | Documentação |

---

## Quick Reference (copiar/colar)

```bash
# Team ID
TEAM_ID=6a0fb0e7-399a-4b7a-91e5-943e5d6017bf

# Status IDs
STATUS_TODO=54c01d00-aa5b-4a55-a648-cb89e20177a7
STATUS_IN_PROGRESS=29f11d75-12ba-4469-a011-15047f9e7e91
STATUS_DONE=d626a88f-e52b-4af0-be5b-bc40620f4eb0
```

---

## Referências

- **Config mcporter:** `~/.mcporter/mcporter.json`
- **Skill completa:** `/Users/mauricio/.openclaw/skills/linear-planner/SKILL.md`
- **Integração:** `/Users/mauricio/.openclaw/skills/linear-planner/references/linear-integration.md`

---

## Skills Disponíveis

### planning
**Path:** `/Users/mauricio/.openclaw/skills/planning/SKILL.md`

**Usar para:**
- Planejamento R.P.I.V (Research → Plan → Implement → Validate)
- Criar PRPs (Project Requirement Plans)

### linear-planner
**Path:** `/Users/mauricio/.openclaw/skills/linear-planner/SKILL.md`

**Usar para:**
- Tracking de tasks no Linear (Projeto Benício)
- Decomposição em subtasks atômicas

### gog-workspace (Google Workspace)
**Path:** `/Users/mauricio/.openclaw/skills/gog-workspace/SKILL.md`

**Usar para:**
- Gerenciar agenda do Maurício
- Enviar emails
- Buscar documentos no Drive
- Ler/escrever planilhas

**Comandos principais:**
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

### zoom
**Path:** `/Users/mauricio/.openclaw/skills/zoom/SKILL.md`

**Usar para:**
- Criar reuniões para o Maurício
- Ver resumos de calls (AI Companion)

**Comandos:**
```bash
python3 /Users/mauricio/.openclaw/scripts/zoom_cli.py create-meeting "Reunião" "2026-02-05T10:00:00" 60
python3 /Users/mauricio/.openclaw/scripts/zoom_cli.py list-meetings
python3 /Users/mauricio/.openclaw/scripts/zoom_cli.py get-summary <meetingId>
```

### notion
**Path:** `/Users/mauricio/.openclaw/skills/notion/SKILL.md`

**Usar para:**
- Extrair conteúdo do Notion
- Sync databases para outros sistemas

---

*Última atualização: 2026-02-03*

