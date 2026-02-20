# TASK-2026-02-20: Otimização Definitiva da Conexão WhatsApp (Baileys) e Memória

## 1. Pesquisa e Diagnóstico (Research)
- [x] Identificar causa raiz da dependência do Browser Relay (Diagnóstico: Banco SQLite corrompido).
- [ ] Pesquisar melhores práticas de persistência do Baileys em produção para evitar quedas e reconexões (Performance).
- [ ] Investigar como integrar o fluxo de mensagens do Baileys diretamente com o NeonDB (PostgreSQL) para armazenamento robusto (substituindo ou reforçando o SQLite local).
- [ ] Analisar a integração atual com o UDS (Pesquisa Semântica) para garantir que mensagens do WhatsApp sejam indexadas em tempo real.

## 2. Planejamento (Plan)
- [ ] Criar arquitetura de dados: Baileys -> NeonDB -> UDS (Fluxo de ingestão).
- [ ] Definir script de migração/backup para o banco SQLite corrompido.
- [ ] Desenhar o fluxo de "Auto-Reconnect" aprimorado para o Baileys.

## 3. Implementação (Implement) - ATOMIC TASKS
- [ ] **Task A (Urgente):** Reparar/Recriar o arquivo `main.sqlite` local para destravar o UDS imediato e remover dependência do navegador.
- [ ] **Task B:** Configurar conexão persistente do plugin de memória com o NeonDB (usando a `DATABASE_URL` já existente).
- [ ] **Task C:** Implementar mecanismo de "Heartbeat" específico para a conexão Baileys (monitorar e reiniciar socket automaticamente).
- [ ] **Task D:** Configurar pipeline de indexação para enviar novas mensagens do WhatsApp para o UDS (vetorial) automaticamente.

## 4. Validação (Validate)
- [ ] Testar busca de uma mensagem antiga via comando `uds search` ou `memory search`.
- [ ] Verificar estabilidade da conexão WhatsApp por 24h sem quedas.
- [ ] Confirmar que o SDR Lead Checker consegue ler leads sem abrir o navegador.
