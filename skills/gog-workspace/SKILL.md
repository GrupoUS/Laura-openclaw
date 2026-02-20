---
name: gog-workspace
description: "Reliable Google Workspace skill via MCP server. Prefer mcporter over gogcli when available."
metadata: {"openclaw":{"emoji":"🏢"}}
---

# Google Workspace (MCP & GOG)

## Primary: MCP Server (via mcporter)
**Use this for most operations as it is pre-configured and auth-ready.**

**Server Name:** `google-workspace`

### Available Tools
- `gmail_list_emails(hours?, maxResults?, query?)`
- `gmail_send_email(to, subject, body, ...)`
- `gmail_search_emails(query, maxResults?)`
- `calendar_list_events(calendarId?, date?, days?, maxResults?)`
- `calendar_create_event(calendarId?, summary, start, end, ...)`
- `drive_list_files(folderId?, pageSize?, query?, ...)`
- `drive_search_files(query, pageSize?, ...)`
- `drive_create_folder(name, parentId?, ...)`
- `drive_upload_file(name, content, mimeType, ...)`
- `drive_create_doc(title, content?, isHtml?, parentId?)`

### Common Usage
```bash
# List emails
mcporter call google-workspace.gmail_list_emails hours:24

# Search Drive
mcporter call google-workspace.drive_search_files query:"name contains 'Report'"

# List Calendar
mcporter call google-workspace.calendar_list_events days:7

# Create Doc
mcporter call google-workspace.drive_create_doc title:"My Doc" content:"Hello World" parentId:"<folder_id>"
```

---

## Secondary: gogcli (Legacy/Fallback)
**Only use if MCP server is unavailable or specific CLI feature is needed.**

### Calendar
- `gog calendar events --all --today --json`

### Gmail
- `gog gmail search 'newer_than:7d' --json`

### Auth Status
Check with: `gog auth status` (requires setup)
