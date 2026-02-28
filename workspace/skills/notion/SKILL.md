---
name: notion-cms
description: "Guide for extracting content from Notion (Pages & Databases) using the Notion API v2025-09-03 and converting it to high-fidelity Markdown/HTML..."
metadata: {"openclaw":{"emoji":"📓"}}
---

# Notion CMS Integration

## Overview

> Guide for extracting content from Notion (Pages & Databases) using the Notion API **v2025-09-03** and converting it to high-fidelity Markdown/HTML for website CMS integration.

This skill enables the extraction of structured content from Notion for use in external websites (CMS). It leverages the **Notion MCP Server** (or direct API calls) to fetch raw block data and uses specialized Python scripts to convert that data into clean, front-matter-enriched Markdown.

**API Version:** `2025-09-03` (multi-source databases with `data_source_id`)

**Use this skill when:**

- The user wants to "sync" or "copy" Notion pages to a website.
- The user asks to "get all data" from a Notion Database.
- You need to convert Notion Blocks (headers, lists, images, code) into Markdown.
- The user needs to query, create pages, or update properties in Notion databases.

## Key Concept: Data Sources (v2025-09-03)

Starting with API v2025-09-03, Notion databases contain **data sources**. Most operations that previously used `database_id` now require a `data_source_id`.

**Discovery pattern:** Always resolve `database_id` → `data_source_id` before querying.

```
GET /v1/databases/{database_id}  →  response.data_sources[0].id  →  data_source_id
```

### Endpoint Migration Table

| Operation | Old Endpoint (v2022-06-28) | New Endpoint (v2025-09-03) |
|-----------|---------------------------|---------------------------|
| Query pages | `POST /v1/databases/:db_id/query` | `POST /v1/data_sources/:ds_id/query` |
| Get schema | `GET /v1/databases/:db_id` | `GET /v1/data_sources/:ds_id` |
| Update schema | `PATCH /v1/databases/:db_id` | `PATCH /v1/data_sources/:ds_id` |
| Create page | parent: `database_id` | parent: `data_source_id` |
| Search filter | `filter.value = "database"` | `filter.value = "data_source"` |
| Create DB | `properties` at top level | `initial_data_source.properties` |

**Unchanged:** Page CRUD (`/v1/pages/:id`), Block CRUD (`/v1/blocks/:id`), Comments, File uploads.

## Capability Protocols

### 0. Data Source Discovery (Required First Step)

Before any database operation, resolve the `data_source_id`:

1. **Get Database:** Call `GET /v1/databases/{database_id}` with `Notion-Version: 2025-09-03`
2. **Extract Data Source:** Use `response.data_sources[0].id` (single-source databases have exactly one)
3. **Cache:** Store the mapping for subsequent calls in the same session

**Script helper:**
```bash
node scripts/notion-discover-datasources.js <database_id>
node scripts/notion-discover-datasources.js <database_id> --json
```

### 1. Database Discovery & Extraction

To extract all pages from a database:

1. **Identify Database**: Use `mcp_notion_server_API_search_by_title` (or similar search tool) to find the database ID if not provided.
2. **Discover Data Source**: Follow Protocol 0 to get the `data_source_id`.
3. **Query Data Source**: Use `mcp_notion_server_API_query_data_source` with the `data_source_id` to get the list of pages.
4. **Iterate**: For each page, extract its content (see Protocol 2).

### 2. Page Content Extraction (Deep Fetch)

Notion pages are composed of "Blocks". To get the full content, you must retrieve the blocks.

1. **Retrieve Metadata**: Use `mcp_notion_server_API_retrieve_a_page` to get the page title, cover image, and properties (for frontmatter).
2. **Retrieve Content**: Use `mcp_notion_server_API_retrieve_block_children` with the Page ID.
   - _Note_: If a block has `has_children: true`, you must recursively call `retrieve_block_children` on that block ID to get nested content (like lists or toggles).
3. **Parse & Save**:
   - Do NOT attempt to manually format the JSON output into Markdown in your response.
   - INSTEAD, save the raw JSON response to a temporary file (e.g., `temp_notion_data.json`).
   - Run the bundled script `scripts/json_to_markdown.py` to convert the JSON to a `.md` file.

### 3. Creating Pages in a Database

When creating pages, use `data_source_id` as the parent:

```json
POST /v1/pages
{
  "parent": {
    "type": "data_source_id",
    "data_source_id": "<data_source_id>"
  },
  "properties": { ... }
}
```

### 4. Markdown Conversion Rule

Always use the `scripts/json_to_markdown.py` script for conversion. It handles:

- Standard blocks (H1-H3, Paragraph, Lists).
- Rich text (Bold, Italic, Links).
- Code blocks (with language).
- Images (extracting URLs).
- Callouts and Quotes.
- Toggle blocks (via HTML `<details>`).

## Workflow Example

**User:** "Copy the 'Blog' database to my site."

**Agent Plan:**

1. Search for "Blog" database -> ID: `db-123`.
2. Discover data source -> `node scripts/notion-discover-datasources.js db-123 --json` -> data_source_id: `ds-456`.
3. Query `ds-456` -> Returns 5 pages.
4. For each page:
   a. `retrieve_a_page(page_id)` -> Get title "Hello World".
   b. `retrieve_block_children(page_id)` -> Get blocks JSON.
   c. `write_to_file("temp.json", blocks_json)`.
   d. `run_command("python3 skills/notion/scripts/json_to_markdown.py temp.json --output content/hello-world.md --frontmatter '{\"title\": \"Hello World\"}'")`.
   e. Confirm file creation.

## Configuration

**API Key:** Stored at `~/.config/notion/api_key` (file-based, one line, no newlines)

**Known Databases:**

| Name | Database ID | Purpose |
|------|------------|---------|
| Lista de Atividades | `1824d8c5-8988-813a-845f-cca3bc410832` | Task tracking + WhatsApp alerts |

## Resources

### scripts/

- `json_to_markdown.py`: Robust converter for Notion Block JSON to Markdown.
- `notion-discover-datasources.js`: Resolve database_id to data_source_id(s).
- `notion-check-tasks.js`: Query pending tasks and group by assignee (cron job).
- `notion-update-status.js`: Update a page's Status property.

### assets/

- `frontmatter_template.yaml`: Template for Jekyll/Hugo/Next.js frontmatter.

### references/

- `api-migration-2025-09-03.md`: Condensed migration guide for API v2025-09-03.
