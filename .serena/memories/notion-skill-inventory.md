# Notion Skill Complete Inventory

**Compiled:** 2026-02-27

---

## 1. Skill Location & Metadata

| Field | Value |
|-------|-------|
| **Skill Path** | `/Users/mauricio/.openclaw/workspace/skills/notion/` |
| **Skill ID** | `notion-cms` |
| **Emoji** | 📓 |
| **Primary Agent** | `orchestrator` |
| **Status** | ACTIVE (referenced in AGENTS.md table) |

---

## 2. Capability Summary

**Purpose:** Extract & convert Notion content (Pages & Databases) to Markdown/HTML for CMS integration

**Use When:**
- User requests "sync" or "copy" Notion pages to a website
- Extract all data from a Notion Database
- Convert Notion Blocks (headers, lists, images, code) to Markdown

---

## 3. Skill Files & Structure

```
/Users/mauricio/.openclaw/workspace/skills/notion/
├── SKILL.md                               # Main skill documentation
├── scripts/
│   └── json_to_markdown.py               # Notion JSON → Markdown converter
└── assets/
    └── frontmatter_template.yaml         # Jekyll/Hugo/Next.js frontmatter template
```

---

## 4. Core Capability Protocols

### Protocol 1: Database Discovery & Extraction
- **Tool:** `mcp_notion_server_API_search_by_title` → Find database by name/ID
- **Tool:** `mcp_notion_server_API_query_data_source` → List all pages in database
- **Iteration:** Process each page individually

### Protocol 2: Page Content Extraction (Deep Fetch)
- **Tool:** `mcp_notion_server_API_retrieve_a_page` → Get page metadata, title, cover image, properties
- **Tool:** `mcp_notion_server_API_retrieve_block_children` → Get page blocks JSON
- **Note:** Recursive required for nested blocks (has_children: true)
- **Conversion:** Run scripts/json_to_markdown.py on JSON output

### Protocol 3: Markdown Conversion
- **Script:** `/Users/mauricio/.openclaw/workspace/skills/notion/scripts/json_to_markdown.py`
- **Always:** Use script—do NOT manually format in response
- **Output:** Markdown with YAML frontmatter

---

## 5. MCP Notion Server API Endpoints

Referenced in SKILL.md (these are the MCP tools to invoke):

| Endpoint | Purpose | Parameters |
|----------|---------|------------|
| `mcp_notion_server_API_search_by_title` | Find database/page by name | title string |
| `mcp_notion_server_API_query_data_source` | Query database, list pages | database_id, filters |
| `mcp_notion_server_API_retrieve_a_page` | Get page metadata & properties | page_id |
| `mcp_notion_server_API_retrieve_block_children` | Get blocks from page | page_id, recursive option |

**API Version:** 2022-06-28 (per scripts)

---

## 6. Scripts Analysis

### json_to_markdown.py
**Location:** `/Users/mauricio/.openclaw/workspace/skills/notion/scripts/json_to_markdown.py`

**Capabilities:**
- Rich text conversion (bold, italic, links, strikethrough, code)
- Block type handlers:
  - Headers (H1, H2, H3)
  - Paragraphs
  - Bulleted/numbered lists
  - To-do checkboxes
  - Toggle blocks (HTML <details>)
  - Code blocks (with language syntax)
  - Quotes & callouts (with emoji)
  - Images (URL extraction + captions)
  - Dividers
- Frontmatter injection (JSON-based)
- Recursive children handling (nested blocks)

**Usage:**
```bash
python3 scripts/json_to_markdown.py <input_json> --output <output.md> --frontmatter '{"title":"...", "date":"..."}'
```

**Arguments:**
- input (positional): Input JSON file path
- --output / -o: Output Markdown file path (optional, prints to stdout if omitted)
- --frontmatter / -f: JSON string of frontmatter key-values (optional)

---

## 7. Frontmatter Template

**File:** `/Users/mauricio/.openclaw/workspace/skills/notion/assets/frontmatter_template.yaml`

**Default Template:**
```yaml
title: "Untitled"
date: "2024-01-01"
author: "Notion"
tags: []
published: true
cover_image: ""
description: ""
```

---

## 8. Operational Scripts (Integration Points)

**Location:** `/Users/mauricio/.openclaw/scripts/`

### notion-check-tasks.js
**Purpose:** Query Notion "Lista de atividades" database for pending tasks

**Config:**
- **Database ID:** `1824d8c5-8988-813a-845f-cca3bc410832` (hardcoded)
- **API Key Source:** ~/.config/notion/api_key (file-based)
- **API Version:** 2022-06-28
- **Notion API Host:** api.notion.com

**Filters:**
- Status != "Concluído" (not done)
- Status != "Cancelado" (not cancelled)

**Extraction:**
- Extracts properties: Status, Responsável (people), Atividade (title), Data de fim (deadline), URL
- Groups tasks by assignee (person name)
- Includes "Sem Responsável" (unassigned) bucket
- Returns JSON

**Usage:**
```bash
node /Users/mauricio/.openclaw/scripts/notion-check-tasks.js
```

**Output Format:** JSON with grouping structure:
```json
{
  "Person Name": [
    { "title": "...", "status": "...", "url": "...", "prazo": "..." }
  ]
}
```

### notion-update-status.js
**Purpose:** Update single Notion page status property

**Config:**
- **API Key Source:** ~/.config/notion/api_key (file-based)
- **API Version:** 2022-06-28
- **Notion API Host:** api.notion.com

**Features:**
- Accepts page ID (32-char hex) or full Notion URL
- Auto-formats ID to UUID (8-4-4-4-12)
- Default status: "Concluído"

**Usage:**
```bash
node /Users/mauricio/.openclaw/scripts/notion-update-status.js <page_id_or_url> [StatusName]
```

**Examples:**
```bash
node notion-update-status.js 1824d8c5-8988-813a-845f-cca3bc410832 "In Progress"
node notion-update-status.js "https://notion.so/page?v=..." "Done"
```

---

## 9. Cron Job Integration

**File:** `/Users/mauricio/.openclaw/cron/jobs.json`

**Job Frequency:** Recurring (appears twice with identical config)

**Trigger:**
1. Execute `scripts/notion-check-tasks.js`
2. Parse output JSON (grouped by person)
3. For each person with tasks:
   - Check `memory/contatos.md` for contact info
   - If found: Send WhatsApp with clean links (no markdown [text](url) format)
   - If NOT found: Group message to Bruno (+5521990869640) asking for contact
   - If unassigned: Alert Maurício or Bruno
4. Always send consolidated report to Raquel (coordinator: +5562981123150)

**Tone:** Helpful + gentle pressure ("tom prestativo e de cobrança leve")

**Channel:** WhatsApp (WhatsApp agents expected to execute this)

---

## 10. Agent Integration Points

**CS Agent** (agents/cs/workspace/TOOLS.md)
- Use Notion skill to:
  - Consult schedules & student journey
  - Extract content for reports
  - Convert playbooks & schedules to Markdown

**Support Agent** (agents/suporte/workspace/TOOLS.md)
- Use Notion skill to:
  - Track tasks in Notion & enforce deadlines
  - Extract team status & deadlines
  - Sync databases to other systems
- **Daily command:** `node /Users/mauricio/.openclaw/scripts/notion-check-tasks.js`
- **Supports:** Rastreamento de Tarefas e Projetos

---

## 11. Architecture Dependencies

**No @notionhq/client NPM Package:**
- Dashboard (Bun) dependencies: NO @notionhq/client found
- Dashboard (Next.js) dependencies: NO @notionhq/client found
- **Native Approach:** Using direct HTTPS to api.notion.com (scripts/)

**API Communication:**
- Scripts use native Node.js https module
- Header-based auth: Authorization: Bearer <NOTION_KEY>
- Notion API version pinned: 2022-06-28

**Credential Storage:**
- **File-based:** ~/.config/notion/api_key
- **NOT in .env or committed to repo**
- **GITIGNORED:** Never exposed

---

## 12. Database Schema References (Hardcoded IDs)

| Database | ID | Purpose | Notes |
|----------|--|---------|----|
| Lista de atividades | 1824d8c5-8988-813a-845f-cca3bc410832 | Task tracking | Used in notion-check-tasks.js |

**Property Mappings:**
| Property | Type | Used By |
|----------|------|---------|
| Atividade | Title | Task title extraction |
| Status | Status | Filter: not "Concluído"/"Cancelado" |
| Responsável | People | Grouping/assignment |
| Data de fim | Date | Deadline extraction |

---

## 13. Known Limitations & Edge Cases

1. **No Recursive Block Handling (Yet):** Script mentions children support but not fully tested
2. **Image URL Extraction:** Handles both file and external URLs from Notion
3. **Toggle Blocks:** Converted to HTML <details> (not pure Markdown)
4. **Emoji Support:** Callout emoji preserved (e.g., emoji)
5. **Link Format Constraint:** WhatsApp integration requires clean URLs

---

## 14. Integration Status

| Component | Status | Dependencies |
|-----------|--------|--------------|
| SKILL.md | ACTIVE | MCP Notion Server (external) |
| json_to_markdown.py | TESTED | Python 3 |
| notion-check-tasks.js | ACTIVE (Cron) | ~/.config/notion/api_key |
| notion-update-status.js | AVAILABLE | ~/.config/notion/api_key |
| Frontmatter template | REFERENCE | N/A |
| Cron integration | SCHEDULED | WhatsApp agent + memory/contatos.md |

---

## 15. Knowledge Gaps & Future Enhancements

- **External Dependency:** MCP Notion Server implementation details not in codebase
- **Authentication:** Full OAuth2 flow not documented
- **Rate Limiting:** No exponential backoff in scripts
- **Error Recovery:** Limited error handling (fails hard on API error)
- **Batch Operations:** No parallel batch processing for large databases
- **Caching:** No caching layer for frequently accessed Notion data

---

## 16. References

- **Skill Path:** /Users/mauricio/.openclaw/workspace/skills/notion/SKILL.md
- **Script 1:** /Users/mauricio/.openclaw/scripts/notion-check-tasks.js
- **Script 2:** /Users/mauricio/.openclaw/scripts/notion-update-status.js
- **Converter:** /Users/mauricio/.openclaw/workspace/skills/notion/scripts/json_to_markdown.py
- **Template:** /Users/mauricio/.openclaw/workspace/skills/notion/assets/frontmatter_template.yaml
- **Integration:** /Users/mauricio/.openclaw/cron/jobs.json
- **Agent Config (CS):** /Users/mauricio/.openclaw/agents/cs/workspace/TOOLS.md
- **Agent Config (Support):** /Users/mauricio/.openclaw/agents/suporte/workspace/TOOLS.md
- **Master Config:** /Users/mauricio/.openclaw/AGENTS.md