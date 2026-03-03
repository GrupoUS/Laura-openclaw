# Skill: Agent Bus — Memória Unificada do Grupo US

## O que é

O **Agent Bus** é o barramento de memória compartilhada entre todos os agentes do Grupo US.
Todos os agentes leem e escrevem nele via NeonDB, garantindo visibilidade total das ações.

**Script:** `/Users/mauricio/.openclaw/agents/main/workspace/scripts/agent_bus.py`

---

## Quando usar

- **Sempre que executar uma ação relevante** → `log`
- **Antes de responder um lead** → `get-lead` (ver o que outros agentes já fizeram)
- **Ao iniciar uma sessão** → `context` (ver o que aconteceu nas últimas 6h)
- **Ao atualizar o estágio de um lead** → `update-lead`
- **Para guardar info que outros agentes precisam** → `set-memory`

---

## Comandos

### 1. Registrar ação (log)
```bash
python3 /Users/mauricio/.openclaw/agents/main/workspace/scripts/agent_bus.py log \
  --agent <seu_agent_id> \
  --type <tipo_do_evento> \
  --content "Descrição do que aconteceu" \
  --meta '{"phone":"+55...", "extra":"dado"}'
```

**Tipos de evento padronizados:**
| Tipo | Quando usar |
|------|-------------|
| `message_sent` | Enviou mensagem para lead/aluno |
| `lead_qualified` | Lead qualificado e pronto para handoff |
| `lead_handoff` | Lead repassado para closer (Lucas/Érica) |
| `task_done` | Tarefa concluída |
| `task_created` | Nova tarefa criada |
| `group_reply` | Respondeu em um grupo do WhatsApp |
| `student_support` | Atendeu aluno (CS) |
| `error_fixed` | Corrigiu um erro/bug |
| `cron_executed` | Cron rodou com resultado |
| `memory_updated` | Atualizou memória de lead/contexto |

### 2. Ver contexto recente (context)
```bash
# Ver tudo que todos os agentes fizeram nas últimas 6h
python3 /Users/mauricio/.openclaw/agents/main/workspace/scripts/agent_bus.py context --hours 6

# Filtrar por agente específico
python3 /Users/mauricio/.openclaw/agents/main/workspace/scripts/agent_bus.py context --hours 12 --agent cs

# JSON para processar programaticamente
python3 /Users/mauricio/.openclaw/agents/main/workspace/scripts/agent_bus.py context --json --hours 24
```

### 3. Ver contexto de um lead (get-lead)
```bash
# SEMPRE checar antes de atender um lead
python3 /Users/mauricio/.openclaw/agents/main/workspace/scripts/agent_bus.py get-lead --phone "+55621..."
```

### 4. Atualizar contexto de lead (update-lead)
```bash
# Após qualificar ou fazer handoff
python3 /Users/mauricio/.openclaw/agents/main/workspace/scripts/agent_bus.py update-lead \
  --phone "+55621..." \
  --agent laura \
  --name "Maria Silva" \
  --product "TRINTAE3" \
  --stage "qualificado" \
  --closer "Lucas" \
  --action "Qualificada: enfermeira, 2 anos de exp, quer pós-graduação" \
  --note "Lead muito quente, respondeu todas as perguntas"
```

### 5. Memória chave-valor compartilhada (set/get-memory)
```bash
# Guardar dado que outros agentes precisam
python3 /Users/mauricio/.openclaw/agents/main/workspace/scripts/agent_bus.py set-memory \
  --key "grupo_diretoria:ultima_mensagem" \
  --value '{"texto":"Denise confirmou Dubai seguro","ts":"2026-03-02T19:00"}' \
  --agent laura

# Buscar
python3 /Users/mauricio/.openclaw/agents/main/workspace/scripts/agent_bus.py get-memory \
  --key "grupo_diretoria:ultima_mensagem"
```

---

## Protocolo de Uso (todos os agentes devem seguir)

### Ao iniciar sessão:
```bash
# 1. Ver o que aconteceu nas últimas 6h
python3 .../agent_bus.py context --hours 6

# 2. Se for atender um lead, checar contexto dele primeiro
python3 .../agent_bus.py get-lead --phone "<numero>"
```

### Ao concluir ação relevante:
```bash
# 3. Registrar o que fez
python3 .../agent_bus.py log --agent <id> --type <tipo> --content "<desc>"

# 4. Se foi lead, atualizar contexto
python3 .../agent_bus.py update-lead --phone "<numero>" --agent <id> --stage "<novo_stage>"
```

---

## Exemplos por Agente

### Laura (SDR/Orquestradora)
```bash
# Ao responder lead novo
agent_bus log --agent laura --type message_sent --content "Abertura SDR para +5562..." --meta '{"phone":"+5562..."}'

# Ao fazer handoff
agent_bus update-lead --phone "+5562..." --agent laura --stage handoff --closer Lucas --action "Qualificada enfermeira, interesse TRINTAE3"
agent_bus log --agent laura --type lead_handoff --content "Lead +5562... passada para Lucas (TRINTAE3)"
```

### CS
```bash
# Ao atender aluno
agent_bus log --agent cs --type student_support --content "Aluno +5562... com dúvida sobre módulo 3" --meta '{"aluno":"+5562...","turma":"T3-2026"}'
```

### Suporte/Coder
```bash
# Ao responder em grupo
agent_bus log --agent suporte --type group_reply --content "Respondeu no grupo Diretoria: confirmou evento Dubai remarcado" --meta '{"group":"120363394424970243@g.us"}'
```

---

## Tabelas NeonDB

| Tabela | Conteúdo |
|--------|----------|
| `agent_events` | Log de todas as ações de todos os agentes |
| `agent_shared_memory` | Memória chave-valor compartilhada |
| `lead_context` | Contexto unificado de leads (todos os agentes veem) |
