# UDS API Reference

## Base URL

`http://localhost:8000`

## Endpoints

### POST /search

Search across all indexed data sources.

**Request:**
```json
{
  "query": "search terms",
  "top_k": 10,
  "search_type": "hybrid"  // "hybrid" | "bm25" | "vector"
}
```

**Response:**
```json
{
  "query": "search terms",
  "results": [
    {
      "chunk_id": "uuid",
      "file_id": "uuid",
      "drive_file_id": "source-specific-id",
      "file_name": "Document Name",
      "file_path": "/notion/Page Title",
      "content": "matched text chunk...",
      "heading": "Section Heading",
      "bm25_score": 16.74,
      "vector_score": 0.749,
      "rrf_score": 0.032
    }
  ]
}
```

### GET /context/{chunk_id}

Get surrounding context for a search result.

**Parameters:**
- `window` (query, optional): Number of adjacent chunks (default: 2)

### GET /sync/status

Returns file counts by source type.

### POST /sync/{source}

Trigger manual sync. Source: `notion`, `kiwify`, `drive`.

### GET /health

Health check endpoint.

## Data Sources

| Source | Count | Updated |
|--------|-------|---------|
| Google Drive | 10,957+ | Via webhooks or manual |
| Notion | 143+ | Every 6h (cron) |
| Kiwify | 120+ | Every 6h (cron) |

## Path Patterns

- Drive: `/Meu Drive/[folder]/[file]`
- Notion: `/notion/[page title]`
- Kiwify Products: `/kiwify/produtos/[name]`
- Kiwify Sales: `/kiwify/vendas/[customer]/[product]`
