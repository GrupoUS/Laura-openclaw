---
name: evolution-core
description: Use when starting sessions to load historical context, or after fixing errors to capture learnings for future reference. Provides persistent SQLite-based memory across sessions.
---

# Evolution Core

Sistema minimalista de memória persistente.

## Como Funciona

**Hooks** (em `.claude/hooks/`) capturam eventos automaticamente usando **JSONL**:
- `evolution-load.sh` → Mostra erros recentes no SessionStart
- `evolution-error.sh` → Captura erros em PostToolUseFailure
- `evolution-end.sh` → Log de fim de sessão em Stop

**CLI** (`memory_manager.py`) para queries manuais com SQLite.

## Arquivos Gerados

```
.claude/docs/evolution/
├── errors.jsonl     # Erros capturados pelos hooks
├── sessions.jsonl   # Logs de sessão
└── memory.db        # Banco SQLite (via CLI)
```

## CLI Commands

```bash
# Inicializar banco
python3 .claude/skills/evolution-core/scripts/memory_manager.py init

# Gerenciar sessões
python3 .claude/skills/evolution-core/scripts/memory_manager.py session start -t "task"
python3 .claude/skills/evolution-core/scripts/memory_manager.py capture "observation"
python3 .claude/skills/evolution-core/scripts/memory_manager.py session end -s "summary"

# Carregar contexto
python3 .claude/skills/evolution-core/scripts/memory_manager.py load_context --project "$PWD"

# Estatísticas
python3 .claude/skills/evolution-core/scripts/memory_manager.py stats
```
