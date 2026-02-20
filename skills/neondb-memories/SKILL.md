---
name: neondb-memories
description: Gerenciamento de memórias no NeonDB (tabela laura_memories).
metadata: {"openclaw": {"always": true, "requires": {"env": ["NEON_DATABASE_URL"]}}}
---
# neondb-memories Tool

## Actions
- `save_memory(content, metadata)`: Salva uma nova memória.
- `search_memories(query, limit)`: Busca memórias por conteúdo (texto simples por enquanto).
- `list_memories(limit)`: Lista as memórias mais recentes.
