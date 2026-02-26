# NotebookLM CLI Reference

> Complete `nlm` command reference. Source: [CLI Guide](https://github.com/jacob-bd/notebooklm-mcp-cli/blob/main/docs/CLI_GUIDE.md)

## Installation

```bash
uv tool install notebooklm-mcp-cli   # Recommended
# OR
pip install notebooklm-mcp-cli
```

## Authentication

```bash
nlm login                           # Browser-based auth (extracts cookies)
nlm login --check                   # Verify auth status
nlm login switch <profile>          # Switch profile
nlm login profile list              # List profiles with emails
nlm doctor                          # Full diagnostics
```

- Sessions last ~20 minutes
- Auto-refresh: v0.1.9+ handles CSRF token refresh automatically
- If auto-refresh fails: run `nlm login` again

## Notebooks

```bash
nlm notebook list                    # List all notebooks
nlm notebook list --json             # JSON output
nlm notebook create "Title"          # Create notebook
nlm notebook get <id>                # Get details
nlm notebook describe <id>           # AI summary
nlm notebook rename <id> "New"       # Rename
nlm notebook delete <id> --confirm   # Delete (IRREVERSIBLE)
nlm notebook query <id> "question"   # Chat with sources (Q&A)
```

## Sources

```bash
nlm source list <notebook>                              # List sources
nlm source add <notebook> --url "https://..." --wait    # Add URL
nlm source add <notebook> --text "content" --title "T" --wait  # Add text
nlm source add <notebook> --file doc.pdf --wait         # Upload file
nlm source add <notebook> --youtube "https://..." --wait  # YouTube
nlm source add <notebook> --drive <doc-id> --wait       # Google Drive
nlm source get <source-id>                              # Get content
nlm source describe <source-id>                         # AI summary
nlm source stale <notebook>                             # Check stale Drive sources
nlm source sync <notebook> --confirm                    # Sync stale sources
nlm source delete <source-id> --confirm                 # Delete (IRREVERSIBLE)
```

> **Always use `--wait`** when adding sources — they aren't queryable until processed.

## Research

```bash
nlm research start "query" --notebook-id <id> --mode fast   # Quick search
nlm research start "query" --notebook-id <id> --mode deep   # Extended
nlm research start "query" --notebook-id <id> --source drive # Drive search
nlm research status <notebook> --max-wait 300               # Poll until done
nlm research import <notebook> <task-id>                    # Import sources
```

## Studio Content Creation

```bash
# Audio (podcasts)
nlm audio create <notebook> --format deep_dive --length long --confirm
# Formats: deep_dive, brief, critique, debate
# Lengths: short, default, long

# Video
nlm video create <notebook> --format explainer --style classic --confirm

# Reports
nlm report create <notebook> --format "Briefing Doc" --confirm
# Formats: "Briefing Doc", "Study Guide", "Blog Post", "Create Your Own"

# Quiz & Flashcards
nlm quiz create <notebook> --count 10 --difficulty medium --confirm
nlm flashcards create <notebook> --difficulty hard --confirm

# Other
nlm mindmap create <notebook> --confirm
nlm slides create <notebook> --confirm
nlm infographic create <notebook> --orientation landscape --confirm
nlm data-table create <notebook> --description "..." --confirm
```

## Downloads

```bash
nlm download audio <notebook> <artifact-id> --output file.mp3
nlm download video <notebook> <artifact-id> --output file.mp4
nlm download report <notebook> <artifact-id> --output file.md
nlm download mind-map <notebook> <artifact-id> --output file.json
nlm download slide-deck <notebook> <artifact-id> --output file.pdf
nlm download infographic <notebook> <artifact-id> --output file.png
nlm download data-table <notebook> <artifact-id> --output file.csv
nlm download quiz <notebook> <artifact-id> --format html --output quiz.html
nlm download flashcards <notebook> <artifact-id> --format markdown --output cards.md
```

## Sharing

```bash
nlm share status <notebook>                       # View settings
nlm share public <notebook>                       # Enable public link
nlm share private <notebook>                      # Disable public link
nlm share invite <notebook> email@example.com     # Invite viewer
nlm share invite <notebook> email --role editor   # Invite editor
```

## Management

```bash
nlm alias set <name> <notebook-id>    # Create alias
nlm studio status <notebook>          # Check generation status
nlm studio delete <notebook> <id> --confirm  # Delete artifact
nlm chat configure <notebook> --goal learning_guide --length longer
nlm setup add antigravity             # Configure MCP for Antigravity
```

## Output Formats

| Flag | Description |
|------|-------------|
| (none) | Rich table format |
| `--json` | JSON output (parseable) |
| `--quiet` | IDs only |
| `--title` | "ID: Title" format |
| `--full` | All columns |
