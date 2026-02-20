# Linear MCP Integration Guide

Reference for using Linear MCP tools with the Benício project.

## Configuration

| Key            | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Workspace      | GPUS                                                   |
| Team           | Gpus (ID: `6a0fb0e7-399a-4b7a-91e5-943e5d6017bf`)      |
| Team Key       | GPU                                                    |
| Project        | Benício (ID: `7d85ccae-68fc-4a9b-bbcd-e54e394d4f0e`)   |
| Project URL    | https://linear.app/gpus/project/benicio-7aa0c62c6da4  |
| MCP Server     | `@mseep/linear-mcp` via mcporter                       |
| Config Path    | `~/.mcporter/mcporter.json`                            |

---

## Workflow States

> **IMPORTANTE:** O `update_issue` requer UUIDs para status, não texto.

| State | UUID | Description |
|-------|------|-------------|
| **Backlog** | `25ff79da-e1a3-4d7d-937b-92fef2802fac` | Planejado mas não priorizado |
| **Todo** | `54c01d00-aa5b-4a55-a648-cb89e20177a7` | Pronto para iniciar |
| **In Progress** | `29f11d75-12ba-4469-a011-15047f9e7e91` | Em execução |
| **In Review** | `77fb9267-983c-47ab-8721-2fc6259578a2` | Aguardando revisão |
| **Done** | `d626a88f-e52b-4af0-be5b-bc40620f4eb0` | Concluído |
| **Canceled** | `79b04cb2-2319-4a38-a306-8993b4a902cd` | Cancelado |

---

## Available Tools (7 total)

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `create_issue` | Criar nova issue | title, teamId |
| `update_issue` | Atualizar issue | issueId |
| `get_issue` | Ver detalhes | issueId |
| `list_issues` | Listar issues | (optional filters) |
| `search_issues` | Buscar por texto | query |
| `list_teams` | Listar times | (none) |
| `list_projects` | Listar projetos | (optional teamId) |

---

## MCP Commands

### Create Issue

```bash
mcporter call linear create_issue \
  teamId=6a0fb0e7-399a-4b7a-91e5-943e5d6017bf \
  title="[Feature] Description" \
  description="Details in markdown" \
  priority=3
```

Priority values: 0=None, 1=Urgent, 2=High, 3=Normal, 4=Low

### List Issues

```bash
mcporter call linear list_issues \
  teamId=6a0fb0e7-399a-4b7a-91e5-943e5d6017bf \
  first=20
```

### Update Issue Status

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

### Search Issues

```bash
mcporter call linear search_issues query="bug fix" first=10
```

### Get Issue Details

```bash
mcporter call linear get_issue issueId=<issue_id>
```

### List Teams

```bash
mcporter call linear list_teams
```

### List Projects

```bash
mcporter call linear list_projects teamId=6a0fb0e7-399a-4b7a-91e5-943e5d6017bf
```

---

## Workflow Pattern

### R.P.I.V with Linear Tracking

```
1. RESEARCH
   └─ Search existing issues, understand context

2. PLAN
   └─ Create parent issue with subtasks

3. IMPLEMENT
   └─ Update status: In Progress → Done

4. VALIDATE
   └─ Mark parent issue as Done
```

### Status Update Pattern

```bash
# Starting work
mcporter call linear update_issue \
  issueId=<id> \
  status=29f11d75-12ba-4469-a011-15047f9e7e91

# Finished work
mcporter call linear update_issue \
  issueId=<id> \
  status=d626a88f-e52b-4af0-be5b-bc40620f4eb0
```

---

## Quick Reference

```bash
# IDs for copy/paste
TEAM_ID=6a0fb0e7-399a-4b7a-91e5-943e5d6017bf
PROJECT_ID=7d85ccae-68fc-4a9b-bbcd-e54e394d4f0e

# Status UUIDs
STATUS_BACKLOG=25ff79da-e1a3-4d7d-937b-92fef2802fac
STATUS_TODO=54c01d00-aa5b-4a55-a648-cb89e20177a7
STATUS_IN_PROGRESS=29f11d75-12ba-4469-a011-15047f9e7e91
STATUS_IN_REVIEW=77fb9267-983c-47ab-8721-2fc6259578a2
STATUS_DONE=d626a88f-e52b-4af0-be5b-bc40620f4eb0
STATUS_CANCELED=79b04cb2-2319-4a38-a306-8993b4a902cd
```

---

## Best Practices

1. **Always use UUIDs for status** — text values like "In Progress" won't work
2. **Include teamId** when creating issues
3. **Update status in real-time** — In Progress when starting, Done when complete
4. **Search before creating** — avoid duplicate issues
5. **Use descriptive titles** with type prefix: [Feature], [Bug], [Chore]

---

## Troubleshooting

### Check if Linear MCP is available

```bash
mcporter list
```

Expected: `linear (7 tools)`

### Test connectivity

```bash
mcporter call linear list_teams
```

Expected: Team "Gpus" with key "GPU"

---

*Last updated: 2026-02-03*
