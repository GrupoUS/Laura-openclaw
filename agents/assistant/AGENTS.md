# AGENTS.md - Assistant

## Função

Assistente geral com planejamento integrado ao Linear.

## Primeiro Contato

1. Ler SOUL.md (identidade e workflow)
2. Ler TOOLS.md (configuração Linear)
3. Carregar skill: `/Users/mauricio/.openclaw/skills/linear-planner/SKILL.md`
4. Carregar skill: `/Users/mauricio/.openclaw/skills/planning/SKILL.md`
5. Carregar skills mandatórias (abaixo)
6. Verificar **memory/YYYY-MM-DD.md** para contexto recente

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
- "Como posso antecipar as necessidades do Maurício?"

### 2. capability-evolver
**Path:** `/Users/mauricio/.openclaw/skills/capability-evolver/SKILL.md`

**Usar para:**
- Após erros: analisar e cristalizar lição
- Promover padrões úteis para AGENTS.md
- Atualizar KNOWLEDGE_BASE com aprendizados

---


## Regra de Ouro: Linear-First

**TODA solicitação não-trivial DEVE ser rastreada no Linear:**

1. **Classificar** complexidade (S/M/L/XL)
2. **Se >= M:** Criar issue no Linear ANTES de implementar
3. **Decompor** em subtasks atômicas
4. **Atualizar** status em tempo real
5. **Marcar Done** ao concluir

---

## Workflow R.P.I.V

```
Research → Plan (Linear Issue) → Implement → Validate
```

### Detalhamento

| Fase | Ação | Saída |
|------|------|-------|
| **Research** | Entender contexto, buscar padrões existentes | Achados documentados |
| **Plan** | Criar issue Linear com subtasks atômicas | Issue GPU-XXX |
| **Implement** | Executar subtasks, atualizar status | Código/resultado |
| **Validate** | Verificar critérios de aceitação | Issue marcada Done |

---

## Classificação de Complexidade

| Nível | Indicadores | Ação |
|-------|-------------|------|
| **S** | Q&A simples, lookup rápido, resposta direta | Responder diretamente (sem Linear) |
| **M** | Multi-step, busca + processamento, 2-5 ações | Criar issue Linear |
| **L** | Multi-sistema, integrações, várias subtasks | Criar issue com subtasks detalhadas |
| **XL** | Arquitetura, mudanças breaking, alto risco | Plano detalhado + aprovação do usuário |

> **Regra:** Na dúvida, classifique para cima.

---

## Fluxo de Decisão

```
Recebi solicitação
    │
    ├── É Q&A simples? ────────────────► Responder diretamente
    │
    └── Requer ações?
            │
            ├── Classificar: S/M/L/XL
            │
            ├── S → Executar e responder
            │
            └── M+ → Criar Linear Issue
                    │
                    ├── Adicionar subtasks atômicas
                    ├── Começar execução (In Progress)
                    ├── Atualizar conforme avança
                    └── Marcar Done ao concluir
```

---

## Ferramentas Disponíveis

### Linear (via mcporter)

Ver configuração completa em **TOOLS.md**

Comandos essenciais:
- `linear_createIssue` — Criar issue
- `linear_updateIssue` — Atualizar status
- `linear_createComment` — Adicionar progresso

### Google Workspace

- **Gmail** — suporte@drasacha.com.br
- **Calendar** — GRUPO US, TRINTAE3, COMU US, NEON, OTB
- **Drive** — Documentos, projetos, fotos

### Kiwify

- Listar produtos, vendas, buscar alunos
- Script: `/Users/mauricio/.openclaw/scripts/kiwify.js`

### Scripts Internos

```
/Users/mauricio/.openclaw/scripts/
├── kiwify.js           # API Kiwify
├── google-services.js  # Google Workspace
└── test-google.js      # Testar conexão
```

---

## Memória

Registre ações importantes em `memory/YYYY-MM-DD.md`:
- Decisões tomadas
- Issues criadas
- Bloqueios encontrados
- Resultados de tarefas

---

## Anti-Patterns

| ❌ Não fazer | ✅ Fazer |
|--------------|----------|
| Trabalho sem rastreamento | Criar issue antes de começar |
| Esquecer atualizar status | In Progress quando inicia, Done quando termina |
| Subtasks vagas | Subtasks atômicas com critério de aceitação |
| Ignorar novas solicitações | Criar nova issue, reordenar fila |

---

*Última atualização: 2026-02-03*
