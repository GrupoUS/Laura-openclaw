---
name: uds-search
description: "Universal Data System (UDS) search skill for finding information across Google Drive, Notion, and Kiwify."
metadata: {"openclaw":{"emoji":"🗃️"}}
---

# UDS — Universal Data System Search

## Overview

> Universal Data System (UDS) search skill for finding information across Google Drive, Notion, and Kiwify. Use when searching for internal documents, student data, sales records, products, meeting notes, project tasks, or any company information. This skill should be used whenever the agent needs to find or retrieve information from any data source.


## Overview

The Universal Data System indexes all company data from **Google Drive** (10,957+ files), **Notion** (143+ pages), and **Kiwify** (products + sales). All content is chunked, embedded, and searchable via hybrid BM25 + vector search through a single REST API at `http://localhost:8000`.

**Use this skill when:**

- Searching for any internal document, file, or data
- Looking up student/customer information
- Finding product details or sales records
- Retrieving meeting notes or project documentation
- Answering questions that require company knowledge

## Search Strategy

### Decision Matrix

| Need | Search Type | Why |
|------|-------------|-----|
| Exact name/term (e.g. "NEON", specific person) | `bm25` | Keyword precision |
| Conceptual question (e.g. "como funciona MBA") | `vector` | Semantic understanding |
| General search (default) | `hybrid` | Best of both worlds |

### Tips for Better Results

1. **Be specific** — `"pagamento MBA aluno João"` beats `"pagamento"`
2. **Use Portuguese** — Most content is in PT-BR
3. **Increase top_k** — Use `top_k: 10-20` for broad searches, `top_k: 3-5` for precise ones
4. **Check source_type** — Filter mentally by file_path prefix:
   - `/notion/` → Notion pages
   - `/kiwify/` → Products and sales
   - `/Meu Drive/` → Google Drive files

## API Endpoints

### Search (Primary)

```bash
curl -s -X POST http://localhost:8000/search \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "termo de busca",
    "top_k": 10,
    "search_type": "hybrid"
  }' | python3 -m json.tool
```

**Parameters:**
- `query` (required): Search terms in natural language
- `top_k` (optional, default 20): Number of results
- `search_type` (optional): `hybrid` (default), `bm25`, or `vector`

**Response fields per result:**
- `file_name`: Document name
- `file_path`: Full path (indicates source: `/notion/`, `/kiwify/`, `/Meu Drive/`)
- `content`: Matched text chunk
- `heading`: Section heading within the document
- `bm25_score`: Keyword match score
- `vector_score`: Semantic similarity score
- `rrf_score`: Combined score (higher = more relevant)

### Context (Follow-up)

To get surrounding chunks for a specific result:

```bash
curl -s "http://localhost:8000/context/<chunk_id>?window=2" | python3 -m json.tool
```

### Sync Status

Check what's indexed:

```bash
curl -s http://localhost:8000/sync/status | python3 -m json.tool
```

### Trigger Sync (Manual)

```bash
# Sync all Notion pages
curl -s -X POST http://localhost:8000/sync/notion

# Sync Kiwify products + sales
curl -s -X POST http://localhost:8000/sync/kiwify

# Sync Drive changes
curl -s -X POST http://localhost:8000/sync/drive
```

## Source-Specific Guidance

### Google Drive Content
- File types: PDFs, Docs, Sheets, Presentations, text files
- Path structure: `/Meu Drive/[folder]/[file]`
- Best for: Internal documents, policies, contracts, reports

### Notion Content
- All accessible pages and sub-pages indexed
- Path structure: `/notion/[page title]`
- Best for: Project tasks, team notes, meeting notes, process docs

### Kiwify Content
- Products: `/kiwify/produtos/[product name]`
- Sales: `/kiwify/vendas/[customer]/[product]`
- Fields indexed: customer name, email, phone, product, status, payment
- Best for: Customer lookup, product details, sales history

## Workflow Example

**User asks:** "O aluno João Silva comprou o MBA NEON?"

**Agent plan:**

1. Search Kiwify sales by name:
   ```bash
   curl -s -X POST http://localhost:8000/search \
     -H 'Content-Type: application/json' \
     -d '{"query": "João Silva MBA NEON", "top_k": 5, "search_type": "hybrid"}'
   ```

2. If not found, broaden search:
   ```bash
   curl -s -X POST http://localhost:8000/search \
     -H 'Content-Type: application/json' \
     -d '{"query": "João Silva", "top_k": 10}'
   ```

3. Cross-reference with Kiwify API for real-time data:
   ```bash
   node /Users/mauricio/.openclaw/scripts/kiwify.js search "joao.silva@email.com"
   ```

## Important Notes

- UDS is updated every **6 hours** via automated cron jobs
- For real-time Kiwify data (most recent sale), use the Kiwify script directly
- All content is in embeddings with 768-dimension vectors (Gemini)
- The search supports Portuguese text natively
- Health check runs daily at 9 AM via cron
