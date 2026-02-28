# Notion API Migration: v2022-06-28 → v2025-09-03

## Summary

API v2025-09-03 introduces **multi-source databases**. A single database can now contain multiple data sources. Most endpoints that used `database_id` now require `data_source_id`.

## Discovery Pattern (Required)

Before any database operation, resolve the data source:

```javascript
// GET /v1/databases/{database_id} with Notion-Version: 2025-09-03
const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
  headers: {
    'Authorization': `Bearer ${NOTION_KEY}`,
    'Notion-Version': '2025-09-03',
  }
});
const db = await response.json();
const dataSourceId = db.data_sources[0].id; // single-source DB has exactly one
```

## Endpoint Changes

### Query (fetch pages from a database)

```
BEFORE: POST /v1/databases/:database_id/query
AFTER:  POST /v1/data_sources/:data_source_id/query
```

Body remains the same (filters, sorts, page_size, start_cursor).

### Retrieve Schema (properties)

```
BEFORE: GET /v1/databases/:database_id        → returns properties
AFTER:  GET /v1/databases/:database_id        → returns data_sources[] list only
        GET /v1/data_sources/:data_source_id  → returns properties (schema)
```

### Create Page

```json
// BEFORE
{ "parent": { "type": "database_id", "database_id": "..." } }

// AFTER
{ "parent": { "type": "data_source_id", "data_source_id": "..." } }
```

### Update Schema

```
BEFORE: PATCH /v1/databases/:database_id      (properties + title + icon)
AFTER:  PATCH /v1/databases/:database_id      (title, icon, cover, is_inline, parent)
        PATCH /v1/data_sources/:data_source_id (properties, title, in_trash)
```

### Create Database

```json
// BEFORE
{ "parent": {...}, "properties": {...}, "title": [...] }

// AFTER
{ "parent": {...}, "initial_data_source": { "properties": {...} }, "title": [...] }
```

### Search

```json
// BEFORE
{ "filter": { "property": "object", "value": "database" } }

// AFTER
{ "filter": { "property": "object", "value": "data_source" } }
```

Response objects have `"object": "data_source"` instead of `"object": "database"`.

### Relation Properties

Read path returns both `database_id` and `data_source_id`.
Write path: only provide `data_source_id` (not `database_id`).

## Unchanged Endpoints

These work the same in both versions:

- `POST /v1/pages` (page CRUD — only parent type changed)
- `PATCH /v1/pages/:id` (update page properties)
- `GET /v1/blocks/:id` (block operations)
- `GET /v1/blocks/:id/children` (block children)
- `POST /v1/comments` (comments)
- File upload endpoints

## SDK v5

`@notionhq/client` v5.0.0+ supports the new API:

```typescript
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_KEY,
  notionVersion: '2025-09-03',
});

// New methods
const ds = await notion.dataSources.retrieve({ data_source_id: '...' });
const pages = await notion.dataSources.query({ data_source_id: '...' });
```

## Webhook Changes (v2025-09-03)

| Old Event | New Event |
|-----------|-----------|
| `database.content_updated` | `data_source.content_updated` |
| `database.schema_updated` | `data_source.schema_updated` |
| (new) | `data_source.created` |
| (new) | `data_source.moved` |
| (new) | `data_source.deleted` |
| (new) | `data_source.undeleted` |

Page events now include `data.parent.data_source_id`.
