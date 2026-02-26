# Claude Code Hooks - NeonDash

## Visão Geral

Este projeto usa hooks Claude Code para aumentar autonomia de agentes enquanto mantém guardrails de segurança.

## Hooks Configurados

### SessionStart

- **session-context.sh**: Injeta contexto do projeto (branch, último commit, qualidade gates)

### PreToolUse

- **smart-bash-approver.sh**: Auto-aprova comandos seguros, bloqueia perigosos
- **protect-files.sh**: Bloqueia modificação de arquivos sensíveis
- **task-routing-guard.sh**: Bloqueia subagent inválido e reforça Task com roteamento correto

### PermissionRequest

- Auto-aprova Read/Grep/Glob/Serena tools
- Usa smart-bash-approver para Bash

### PostToolUse

- **ultracite-fix.sh**: Formata (Biome) + lint fix (OXLint) após edição (async)

### Stop

- **ultracite-check.sh**: Verifica lint (OXLint) antes de parar — bloqueia em erros
- **background-cleanup.sh**: Lembra cleanup de tarefas em background e registra evento

### SubagentStop

- **subagent-log.sh**: Log de eventos de subagentes para observabilidade
- **oracle-escalation.sh**: Sinaliza escalonamento para oracle em falhas repetidas

### TeammateIdle

- Auto-aprova idle (evita notificações desnecessárias)

### Notification

- **notify.sh**: Notificações desktop (WSL/Linux)

---

## Comandos Seguros (Auto-aprovados)

```bash
# Git
git status, git diff, git log, git branch, git fetch

# File system
ls, cat, head, tail, grep, find, which, pwd, echo

# Bun/Node
bun test, bun run check, bun run lint, bun install, bun x, bun run build
npm test, npm run lint, npm run build
bunx oxlint, bunx biome, bunx ultracite

# Version checks
python3 --version, node --version, bun --version
```

---

## Comandos Bloqueados (Sempre)

```bash
# Destructive
rm -rf /, rm -rf ~, rm -rf *, rm -rf $HOME

# Database
DROP DATABASE, DROP TABLE, TRUNCATE

# Git dangerous
git push --force main, git push --force master, git reset --hard HEAD~

# System
chmod -R 777 /, dd if=... of=/dev/, :(){ :|:& };:
sudo rm, truncate -s 0
```

---

## Arquivos Protegidos

Estes arquivos não podem ser editados via hooks:

| Pattern                              | Razão           |
| ------------------------------------ | --------------- |
| `.env*`                              | Credenciais     |
| `credentials`, `secrets`, `api-keys` | Dados sensíveis |
| `.git/`                              | Repositório     |
| `package-lock.json`, `bun.lockb`     | Lockfiles       |

---

## Testando Hooks

```bash
# Testar aprovação de comando seguro
echo '{"tool_name":"Bash","tool_input":{"command":"bun test"}}' | .claude/hooks/smart-bash-approver.sh
# Expected: {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}

# Testar bloqueio de comando perigoso
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' | .claude/hooks/smart-bash-approver.sh
# Expected: {"hookSpecificOutput":{"...permissionDecision":"deny"...}}

# Testar proteção de arquivo
echo '{"tool_name":"Edit","tool_input":{"file_path":"./.env"}}' | .claude/hooks/protect-files.sh
echo $?
# Expected: Exit code 2, error message on stderr
```

---

## Logs

Eventos de subagentes são logados em:

```
.claude/logs/subagent-events.jsonl
```

Formato:

```json
{
  "timestamp": "2025-02-17T12:00:00Z",
  "agent": "debugger",
  "status": "completed",
  "duration_ms": "5000"
}
```

---

## Debug

```bash
# Ver hooks ativos no Claude Code
/hooks

# Debug mode (ver execução de hooks)
claude --debug

# Verbose mode (output de hooks no transcript)
Ctrl+O
```

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    HOOK FLOW                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SessionStart ──► session-context.sh ──► Prime contexto     │
│                                                              │
│  PreToolUse ────► smart-bash-approver.sh                    │
│               └─► protect-files.sh                          │
│                       │                                      │
│                       ▼                                      │
│              ┌─────────────────┐                             │
│              │ ALLOW / DENY /  │                             │
│              │     ASK         │                             │
│              └─────────────────┘                             │
│                                                              │
│  PermissionRequest ──► Auto-approve read tools              │
│                       └─► smart-bash-approver for Bash      │
│                                                              │
│  PostToolUse ───► ultracite-fix.sh (biome format + oxlint fix)  │
│                                                              │
│  SubagentStop ───► subagent-log.sh + oracle-escalation.sh   │
│                                                              │
│  Stop ──────────► background-cleanup.sh + ultracite-check.sh │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Rollback

Se hooks causarem problemas:

```bash
# Quick disable: remover hooks section do settings.json

# Full rollback:
git checkout .claude/settings.json
rm .claude/hooks/smart-bash-approver.sh
rm .claude/hooks/protect-files.sh
rm .claude/hooks/session-context.sh
rm .claude/hooks/subagent-log.sh
rm -rf .claude/logs
```

---

## Impacto

| Métrica                       | Antes   | Depois         |
| ----------------------------- | ------- | -------------- |
| Aprovações manuais/dia        | ~50     | ~10            |
| Tempo em permissões           | ~15min  | ~3min          |
| Risco de comandos perigosos   | Médio   | Baixo          |
| Observabilidade de subagentes | Nenhuma | Logs completos |
