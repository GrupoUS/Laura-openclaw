---
name: task-planning
description: Decompõe qualquer solicitação em Tasks pai + Subtasks atômicas por fase, persiste no NeonDB e emite evento WS
metadata: {"openclaw": {"always": true, "emoji": "📋"}}
---

# Task Planning

## Quando usar
Sempre que o usuário ou outro agente solicitar que você FAÇA algo (não apenas responda).

## Protocolo obrigatório
1. Crie um Task pai com title, description, phase=1, priority, agent=laura
2. Decomponha em Subtasks atômicas (2-5 min cada), distribuídas por fases
3. Persista via tool `neondb_tasks` com action=create_task
4. Crie as subtasks correspondentes com action=create_subtask
5. Responda confirmando o plano antes de executar
6. A cada subtask concluída, chame neondb_tasks action=update_subtask status=done

## Formato de resposta ao usuário
📋 **Tarefa criada:** [TASK-{id}] {title}
**Fases:**
- Fase 1:
  - {subtasks fase 1}
- Fase 2:
  - {subtasks fase 2}

**Acesse:** https://laura.gpus.me/tasks/{id}
