---
name: neondb-tasks
description: CRUD de Tasks e Subtasks no NeonDB. Disponível para todos os agentes.
metadata: {"openclaw": {"always": true, "requires": {"env": ["NEON_DATABASE_URL"]}}}
---
# neondb-tasks Tool

## Actions disponíveis via index.js (a ser executado via node ou integração direta)
- `create_task(title, description, phase, priority, agent)`
- `create_subtask(task_id, title, phase, agent)`
- `update_task(id, status, priority, agent)`
- `update_subtask(id, status, completed_at)`
- `list_tasks(status, agent, phase)`
- `get_task(id)` -> retorna task + subtasks + events
