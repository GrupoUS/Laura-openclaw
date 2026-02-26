# TOOLS.md - Ferramentas e Configurações do Coder

## ⭐ PRIMARY CODING TOOL — Claude Code (claude)

> **Claude Code está instalado e configurado.** Use-o como ferramenta principal para todas as tarefas de desenvolvimento.

```bash
# Verificar versão
claude --version

# One-shot — tarefa rápida
claude -p "Refatora a função X para usar async/await" --workdir /path/to/project

# Modo interativo (PTY obrigatório!)
exec(command="claude", workdir="/path/to/project", pty=true)

# Background — tarefas longas
exec(command='claude -p "Implementa feature Y completa"', workdir="/path/to/project", pty=true, background=true)
# → retorna sessionId para monitorar
process(action="log", sessionId="XXX")   # ver progresso
process(action="poll", sessionId="XXX")  # aguardar conclusão
```

### ⚠️ REGRAS OBRIGATÓRIAS para Claude Code
1. **SEMPRE** usar `pty=true` — Claude Code é interativo e precisa de terminal
2. **NUNCA** rodar sem PTY — output quebrado ou o agente trava
3. Tarefas > 30s → usar `background=true` + monitorar com `process`
4. Workdir = raiz do projeto (onde está o `package.json` / `bun.lockb`)

### Skill de referência
**Path:** `/Users/mauricio/.openclaw/workspace/.agents/skills/coding-agent/SKILL.md`
(instalado por steipete/clawdis — autor do OpenClaw)

### Skill de Frontend Design
**Path:** `/Users/mauricio/.openclaw/workspace/.agents/skills/frontend-design/SKILL.md`
(instalado por anthropics/claude-code — Anthropic oficial)
Usar em TODAS as tarefas de UI para garantir qualidade premium (sem "AI slop").

---

### OpenCode (legado — usar Claude Code preferencialmente)
```bash
# Verificar versão
opencode --version

# Iniciar sessão ACP (background)
opencode acp  # → retorna processSessionId
```

**Skill legada:** `/Users/mauricio/.openclaw/workspace/skills/opencode-acp-control/SKILL.md`

### Gemini CLI (geração rápida)
```bash
# One-shot
 gemini -p "Explique a arquitetura ideal para este app"

# Com modelo específico
 gemini --model gemini-2.5-flash -p "Gere um esqueleto de app"
```

### GitHub (gh CLI)
```bash
# Status de autenticação
gh auth status

# Listar repos
gh repo list GrupoUS --limit 20

# Clonar
gh repo clone GrupoUS/<repo>

# Issues
gh issue list --repo GrupoUS/<repo>
gh issue view <number> --repo GrupoUS/<repo>
gh issue create --title "..." --body "..."

# Pull Requests
gh pr list --repo GrupoUS/<repo>
gh pr view <number> --repo GrupoUS/<repo>
gh pr create --fill
gh pr merge <number>

# CI/Actions
gh run list --repo GrupoUS/<repo>
gh run view <run-id> --log-failed

# API direta
gh api repos/GrupoUS/<repo>/issues --jq '.[].title'
```

### Node.js
```bash
# Executar script
node scripts/<script>.js

# Com argumentos
node scripts/kiwify.js search "email@example.com"
node scripts/rag-search.js search "termo"

# Debug
NODE_DEBUG=* node script.js
```

### Git
```bash
# Status
git status
git log --oneline -10
git diff

# Branches
git branch -a
git checkout -b <branch>
git checkout <branch>

# Commit
git add <files>
git commit -m "tipo(escopo): mensagem"
git push -u origin <branch>

# Reset/Revert
git stash
git stash pop
git reset --soft HEAD~1  # desfaz último commit
```

### Docker (VPS)
```bash
# Containers
docker ps
docker logs <container>
docker exec -it <container> bash

# Compose
docker compose up -d
docker compose logs -f
docker compose restart <service>
```

---

## APIs Configuradas

### Kiwify
```bash
# Config: /Users/mauricio/.openclaw/config/kiwify.json
# Account ID: hRsfEMMkkwZELXF

node scripts/kiwify.js products      # Listar produtos
node scripts/kiwify.js sales         # Vendas recentes
node scripts/kiwify.js search "..."  # Buscar aluno
```

### Qdrant (Busca Vetorial)
```bash
# URL: http://31.97.170.4:6333
# Collections: grupous_drive, grupous_notion

node scripts/rag-search.js stats     # Ver estatísticas
node scripts/rag-search.js search "termo"  # Buscar
node scripts/rag-indexer.js          # Reindexar tudo
```

### Google Workspace
```bash
# Conta: suporte@drasacha.com.br
# Config: /Users/mauricio/.openclaw/config/google-*.json

node scripts/test-google.js          # Testar conexão
```

### Notion
```bash
# API Key: ~/.config/notion/api_key
# Versão: 2025-09-03

# Indexado no RAG via rag-indexer.js
```

---

## Paths Importantes

| Path | Descrição |
|------|-----------|
| `/Users/mauricio/.openclaw` | Workspace principal |
| `/Users/mauricio/.openclaw/scripts` | Scripts de automação |
| `/Users/mauricio/.openclaw/config` | Credenciais e configs |
| `/Users/mauricio/.openclaw/agents` | Configuração dos agentes |
| `/Users/mauricio/.openclaw/memory` | Memória persistente |
| `~/.openclaw` | Config do OpenClaw |
| `~/.config/gh` | Config do GitHub CLI |

---

## Comandos Úteis

```bash
# Processos Node
pgrep -a node

# Portas em uso
ss -tlnp

# Espaço em disco
df -h

# Memória
free -h

# Logs do sistema
journalctl --user -u openclaw-gateway -f
tail -f ~/.openclaw/logs/*.log

# Buscar em arquivos
grep -r "termo" /Users/mauricio/.openclaw/scripts/
```

---

## Referência Completa
Ver `REFERENCE.md` para documentação técnica detalhada das integrações.

---

## Skills Disponíveis

### planning
**Path:** `/Users/mauricio/.openclaw/workspace/skills/planning/SKILL.md`

**Usar para:** Planejamento R.P.I.V de features complexas

### nano-banana-pro
**Path:** `/Users/mauricio/.openclaw/workspace/skills/nano-banana-pro/SKILL.md`

**Usar para:** Geração de imagens com Gemini 3 Pro

```bash
uv run /Users/mauricio/.openclaw/workspace/skills/nano-banana-pro/scripts/generate_image.py \
  --prompt "descrição da imagem" \
  --filename "output.png" \
  --resolution 4K
```

### gpus-theme
**Path:** `/Users/mauricio/.openclaw/workspace/skills/gpus-theme/SKILL.md`

**Usar para:** Design system Navy/Gold (Grupo US)
- CSS variables em `assets/theme-tokens.css`
- Tailwind config em `assets/tailwind-theme.ts`

### frontend-design
**Path:** `/Users/mauricio/.openclaw/workspace/skills/frontend-design/SKILL.md`

**Usar para:**
- UI/UX design, Tailwind v4
- Generative art (p5.js)
- Canvas art (PDF/PNG)

### notion
**Path:** `/Users/mauricio/.openclaw/workspace/skills/notion/SKILL.md`

**Usar para:** Sync Notion → Website (CMS)

### agent-browser
**Path:** `/Users/mauricio/.openclaw/workspace/skills/agent-browser/SKILL.md`

**Usar para:** Browser automation, scraping, testes

```bash
agent-browser open https://site.com
agent-browser snapshot -i --json
agent-browser click @e1
agent-browser fill @e2 "texto"
```

### skill-creator
**Path:** `/Users/mauricio/.openclaw/workspace/skills/skill-creator/SKILL.md`

**Usar para:** Criar novas skills para OpenClaw

```bash
python scripts/init_skill.py <skill-name> --path /Users/mauricio/.openclaw/workspace/skills/
```

### opencode-acp-control
**Path:** `/Users/mauricio/.openclaw/workspace/skills/opencode-acp-control/SKILL.md`

**Usar para:** Controlar OpenCode via ACP protocol
- Delegar tarefas de coding complexas
- Pair-programming com agente autônomo
- Refactoring e debugging em repos externos

### neondb-tasks (Dashboard de Tasks)
**Path:** `/Users/mauricio/.openclaw/skills/neondb-tasks/SKILL.md`

**Usar para:**
- Reportar atividades de coding no Dashboard
- **Agent ID:** sempre usar `coder`

### neondb-memories (Memórias NeonDB)
**Path:** `/Users/mauricio/.openclaw/skills/neondb-memories/SKILL.md`

**Usar para:**
- Salvar/buscar memórias de conversas e decisões técnicas

### systematic-debugging
**Path:** `/Users/mauricio/.openclaw/workspace/skills/systematic-debugging/SKILL.md`

**Usar para:**
- Debugging estruturado com root-cause analysis
- Reprodução e isolamento de bugs

### proactive-agent
**Path:** `/Users/mauricio/.openclaw/workspace/skills/proactive-agent/SKILL.md`

**Usar para:**
- Limites de contexto e cron jobs

