# NotebookLM Troubleshooting

## Diagnostic Command

Always start here:

```bash
nlm doctor
```

This checks installation, authentication, and configuration.

---

## Common Issues

### 1. CLI Not Installed

**Symptom:** `which nlm` returns nothing, or `nlm: command not found`

**Fix:**
```bash
uv tool install notebooklm-mcp-cli
# OR
pip install notebooklm-mcp-cli
```

**Verify:** `nlm --version`

### 2. Authentication Expired

**Symptom:** Commands fail with auth/cookie errors, or `nlm doctor` reports auth issues

**Fix:**
```bash
nlm login
```

This opens a browser for cookie extraction. Sessions last ~20 minutes.

**Auto-refresh (v0.1.9+):** The CLI auto-refreshes CSRF tokens. If auto-refresh fails, run `nlm login` manually.

### 3. Rate Limit Exceeded (~50/day)

**Symptom:** Commands fail with 429 or rate-limit errors

**Mitigation:**
- Wait until the next day (limits reset daily)
- Batch multiple questions into single, comprehensive queries
- Use `--mode fast` instead of `--mode deep` for research
- Cache query results in `.agent/notebooklm/` to avoid repeat queries

**Workflow impact:** Skip all NLM hooks, continue `/plan` workflow normally.

### 4. Notebook Not Found (Cached ID Invalid)

**Symptom:** Commands with a notebook ID return 404 or "not found"

**Fix:**
1. Remove stale entry from `.agent/notebooklm/notebooks.json`
2. List notebooks: `nlm notebook list --json`
3. Find the correct ID or create a new notebook
4. Update cache

### 5. Source Addition Hangs

**Symptom:** `nlm source add ... --wait` hangs for >60 seconds

**Fix:**
- Cancel the command (Ctrl+C)
- Retry without `--wait`, then check manually:
  ```bash
  nlm source list <notebook>
  ```
- For large files (>10MB): consider adding as URL instead

### 6. Research Returns No Sources

**Symptom:** `nlm research start` returns empty results

**Fix:**
- Retry with broader query terms
- Switch from `--mode fast` to `--mode deep`
- Fall back to Tavily/Context7 MCP cascade
- Add sources manually via `nlm source add --url`

### 7. Studio Content Generation Stuck

**Symptom:** `nlm studio status` shows "processing" for >10 minutes

**Fix:**
- Audio/video can take 1-5 minutes normally
- If stuck >10 min: the generation may have failed silently
- Try creating again with `--confirm`
- Check `nlm studio status <notebook>` for error details

### 8. API Breaking Change

**Symptom:** Previously working commands fail with unexpected errors

**Fix:**
- Check for CLI updates: `uv tool upgrade notebooklm-mcp-cli`
- Review [GitHub releases](https://github.com/jacob-bd/notebooklm-mcp-cli/releases)
- If no fix available: disable NLM hooks temporarily, continue workflow without

---

## Graceful Degradation Principle

> **Every NotebookLM feature is optional.** If any `nlm` command fails:
> 1. Log the error
> 2. Skip the NotebookLM hook
> 3. Continue the main workflow
> 4. Never block `/plan`, `/implement`, or `/debug` for NotebookLM failures
