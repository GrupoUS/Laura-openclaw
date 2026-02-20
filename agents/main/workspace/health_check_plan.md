# Health Check Plan: NeonDB, Auto-Improve, UDS, Drive & Notion

## 1. Verify NeonDB Memory
- [x] Check memory status via CLI (`openclaw memory status` -> returned "disabled/unavailable").
- [ ] Investigate why memory is unavailable.
- [ ] Check `openclaw config get plugins.memory` or similar to see configuration.

## 2. Verify Auto-Improve / Self-Heal
- [x] Review `SELF_HEAL_LOG.md` (File exists and has content).
- [ ] Verify if the mechanism is actively logging (content check).

## 3. Verify UDS (Universal Data System)
- [x] Test UDS search functionality (`openclaw uds` failed).
- [ ] Check if `uds-search` skill is installed or if there's a different command.
- [ ] Read `uds-search` skill documentation if available.

## 4. Verify Google Drive Integration
- [ ] List files in Drive (tried `googlechat` channel, likely wrong approach).
- [ ] Check `gog` skill for Drive access commands.

## 5. Verify Notion Integration
- [x] Found API Key in `~/.openclaw/.env`.
- [x] Configured `~/.config/notion/api_key`.
- [x] Verified connection via curl (User: "Benício Bot").
- [ ] Test Notion skill tool usage (list pages/databases).

## 6. Final Report
- [ ] Compile findings into a summary for Maurício.
- [ ] If any errors are found, apply self-heal protocol if possible.
