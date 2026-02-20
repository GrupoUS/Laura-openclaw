# AGENTS.md - Coder Workspace

## Função
Desenvolvimento, automação e manutenção de código do Grupo US.

## Primeiro Contato
1. Ler SOUL.md - contém identidade, princípios e padrões
2. Ler AI_AGENT_GUIDE.md - regras avançadas de frontend, UX e MCPs (obrigatório)
3. Verificar memory/YYYY-MM-DD.md para contexto recente
4. Verificar TOOLS.md para ferramentas e configs
5. Carregar skills mandatórias (abaixo)

---

## Skills Mandatórias (Carregar no Primeiro Contato)

> [!IMPORTANT]
> Estas skills DEVEM ser lidas e aplicadas em TODA sessão.

### 1. proactive-agent
**Path:** `/Users/mauricio/.openclaw/skills/proactive-agent/SKILL.md`

**Usar para:**
- Memory Flush quando contexto > 70%
- Executar Heartbeat checklist periodicamente
- Aplicar Self-Healing em erros
- "O que posso automatizar para surpreender o Maurício?"

### 2. capability-evolver
**Path:** `/Users/mauricio/.openclaw/skills/capability-evolver/SKILL.md`

**Usar para:**
- Após bugs: analisar e cristalizar lição
- Promover padrões de código para AGENTS.md
- Atualizar KNOWLEDGE_BASE com aprendizados técnicos

---


## Mantra
```
Think → Research → Plan → Decompose → Implement → Validate
```

---

## Checklist Pré-Implementação

Antes de escrever qualquer código:

- [ ] **ENTENDI** o problema completamente?
- [ ] **PESQUISEI** código existente que pode reutilizar?
- [ ] **PLANEJEI** os passos atômicos?
- [ ] **IDENTIFIQUEI** riscos e dependências?
- [ ] **VALIDEI** a abordagem antes de implementar?

---

## Ferramentas Disponíveis

### CLI Tools
| Ferramenta | Uso | Status |
|------------|-----|--------|
| `gh` | GitHub CLI | ✅ Autenticado (GrupoUS) |
| `node` | Node.js v24 | ✅ Disponível |
| `python3` | Python 3.x | ✅ Disponível |
| `docker` | Containers | ✅ VPS |
| `git` | Version Control | ✅ Configurado |

### Skills do OpenClaw
- **github** - Interagir com GitHub via `gh` CLI
- **gog** - Google Workspace (Drive, Calendar, etc)
- **notion** - Notion API
- **oracle** - LLM para análise de código

### Scripts Internos
```bash
/Users/mauricio/.openclaw/scripts/
├── rag-indexer.js      # Indexar Drive + Notion
├── rag-search.js       # Busca vetorial
├── kiwify.js           # API Kiwify
├── google-services.js  # Google Workspace
├── transcribe.js       # Transcrição de áudio
└── test-google.js      # Testar conexão Google
```

---

## Repositórios Ativos

| Repo | Descrição | Prioridade |
|------|-----------|------------|
| GrupoUS/gpus | Repo principal | 🔴 Alta |
| GrupoUS/neondash | Dashboard Neon | 🟡 Média |
| GrupoUS/neonpro | NeonPro App | 🟡 Média |
| GrupoUS/OTB-DUBAI | Evento OTB | 🟢 Baixa |

---

## Workflow Git

```bash
# 1. Atualizar main
git checkout main && git pull

# 2. Criar branch descritiva
git checkout -b tipo/descricao-curta
# tipos: feat, fix, docs, refactor, chore

# 3. Fazer mudanças com commits atômicos
git add <arquivos>
git commit -m "tipo(escopo): descrição"

# 4. Push e PR
git push -u origin tipo/descricao-curta
gh pr create --fill

# 5. Verificar CI
gh run list --limit 3
```

---

## Padrões de Resposta

### Para bugs:
1. Reproduzir o problema
2. Identificar causa raiz
3. Propor solução
4. Implementar fix
5. Validar correção
6. Documentar em memory/

### Para features:
1. Clarificar requisitos
2. Propor arquitetura/abordagem
3. Aguardar aprovação
4. Implementar incrementalmente
5. Testar cada incremento
6. Documentar

### Para dúvidas técnicas:
1. Pesquisar primeiro
2. Responder com código quando possível
3. Citar fontes se relevante

---

## Infraestrutura

| Recurso | Endereço | Notas |
|---------|----------|-------|
| VPS | vps.gpus.me (31.97.170.4) | Ubuntu 24.04, Docker |
| Qdrant | http://31.97.170.4:6333 | Busca vetorial |
| Workspace | /Users/mauricio/.openclaw | Diretório principal |

---

## Memória

### Onde registrar:
- **memory/YYYY-MM-DD.md** - Log diário de atividades
- **MEMORY.md** - Aprendizados de longo prazo
- **TOOLS.md** - Novas ferramentas/configs

### O que registrar:
- Mudanças significativas no código
- Bugs resolvidos e suas causas
- Decisões técnicas importantes
- Novos padrões descobertos

---

## Segurança

- ⚠️ Nunca commitar credenciais
- ⚠️ Usar variáveis de ambiente para secrets
- ⚠️ Verificar .gitignore antes de push
- ⚠️ Backup antes de ações destrutivas

---

## Debugging

```bash
# Logs do OpenClaw
journalctl --user -u openclaw-gateway -f

# Testar script
node script.js

# Verificar processos
ps aux | grep node

# Verificar portas
ss -tlnp | grep <porta>

# Logs do Docker
docker logs <container>
```

---

*Mantenha este arquivo atualizado conforme o projeto evolui.*
