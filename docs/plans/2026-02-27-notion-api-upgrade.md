# Plan: Notion API v2025-09-03 Upgrade & Integration Setup

**Complexity:** L4 | **Tasks:** 8 | **Parallel:** 3 | **Risks:** 2

---

## Context

- Current API version: `2022-06-28` (pinned in all scripts)
- Current implementation: Native HTTPS requests (no SDK)
- Scripts affected: `notion-check-tasks.js`, `notion-update-status.js`
- Skill: `workspace/skills/notion/SKILL.md`
- Credentials: `~/.config/notion/api_key` (file-based)
- Hardcoded database ID: `1824d8c5-8988-813a-845f-cca3bc410832`

## Breaking Change Summary (v2025-09-03)

- `database_id` → `data_source_id` for queries, page creation, relations
- `/v1/databases/:id/query` → `/v1/data_sources/:id/query`
- `/v1/databases/:id` (retrieve) now returns `data_sources[]` list instead of schema
- `/v1/data_sources/:id` is the new endpoint for schema/properties
- Search API filter: `"database"` → `"data_source"`
- Create page parent: `database_id` → `data_source_id`

---

## Phase 1: Chrome — Configure Notion Integration

### Task 1: Create Notion Internal Integration

**Agent:** Browser (Chrome extension)
**Dependencies:** None

**Steps:**
1. Navigate to `https://www.notion.so/profile/integrations`
2. Click "New integration" / "Create new integration"
3. Configure:
   - Name: `OpenClaw` (or `OpenClaw Agents`)
   - Associated workspace: Select the user's workspace
   - Type: Internal integration
   - Capabilities: Read content, Update content, Insert content, Read user information
4. Copy the **Internal Integration Secret** (starts with `ntn_`)
5. Save to `~/.config/notion/api_key`

### Task 2: Connect Integration to Databases

**Agent:** Browser (Chrome extension)
**Dependencies:** Task 1

**Steps:**
1. Navigate to the task database in Notion
2. Click `...` menu → "Connections" → Add `OpenClaw` integration
3. Confirm access grant
4. Repeat for any other databases the agents need access to

### Task 3: Discover data_source_id for Task Database

**Agent:** `debugger`
**Dependencies:** Task 2

**Steps:**
1. Call `GET /v1/databases/1824d8c5-8988-813a-845f-cca3bc410832` with `Notion-Version: 2025-09-03`
2. Extract `data_sources[0].id` from response
3. Store the mapping: `database_id → data_source_id`

---

## Phase 2: Upgrade Scripts [PARALLEL]

### Task 4: Upgrade `notion-check-tasks.js` to v2025-09-03

**File:** `scripts/notion-check-tasks.js`
**Agent:** `debugger`
**Dependencies:** Task 3

**Changes:**
1. Add data source discovery function (fetch database → get data_source_id)
2. Change query endpoint: `/v1/databases/${DATABASE_ID}/query` → `/v1/data_sources/${DATA_SOURCE_ID}/query`
3. Update `Notion-Version` header: `2022-06-28` → `2025-09-03`
4. Add error handling for API version mismatch

### Task 5: Upgrade `notion-update-status.js` to v2025-09-03

**File:** `scripts/notion-update-status.js`
**Agent:** `debugger`
**Dependencies:** Task 3

**Changes:**
1. Update `Notion-Version` header: `2022-06-28` → `2025-09-03`
2. Page update endpoint (`PATCH /v1/pages/:id`) remains the same — no migration needed for page properties
3. Test with a real page update

### Task 6: Create `notion-discover-datasources.js` utility

**File:** `scripts/notion-discover-datasources.js`
**Agent:** `debugger`
**Dependencies:** Task 1

**Purpose:** Reusable helper that takes a database_id and returns data_source_ids. Used by other scripts and agents.

```javascript
// Usage: node notion-discover-datasources.js <database_id>
// Returns: JSON with data_sources array
```

---

## Phase 3: Upgrade Skill Documentation

### Task 7: Update `SKILL.md` for v2025-09-03

**File:** `workspace/skills/notion/SKILL.md`
**Agent:** `orchestrator`
**Dependencies:** Tasks 4-6

**Changes:**
1. Update API version reference from `2022-06-28` → `2025-09-03`
2. Add "Data Source Discovery" as Protocol 0 (before database query)
3. Update Protocol 1: Database Discovery → Data Source Discovery
4. Update MCP tool references: `query_data_source` now uses data_source_id
5. Add mapping table: old endpoints → new endpoints
6. Document the `data_source_id` concept
7. Add `scripts/notion-discover-datasources.js` to Resources section

### Task 8: Create references/api-migration-2025-09-03.md

**File:** `workspace/skills/notion/references/api-migration-2025-09-03.md`
**Agent:** `orchestrator`
**Dependencies:** None

**Content:** Condensed migration guide from Notion docs for agent reference:
- Endpoint mapping table
- data_source_id discovery pattern
- Code snippets for common operations
- Breaking changes checklist

---

## Validation

```bash
# Test data source discovery
node scripts/notion-discover-datasources.js 1824d8c5-8988-813a-845f-cca3bc410832

# Test task check with new API
node scripts/notion-check-tasks.js

# Test status update
node scripts/notion-update-status.js <test-page-id> "Em andamento"
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API key lacks permissions for new endpoints | Medium | High | Test with discovery call first (Task 3) |
| MCP Notion Server not yet updated to v2025-09-03 | Medium | Medium | Scripts use direct HTTPS; MCP is separate concern |

---

## Rollback

All scripts can be reverted to `2022-06-28` by changing the `Notion-Version` header back. The old endpoints still work for single-source databases.
