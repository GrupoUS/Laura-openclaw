# Dashboard de Alunos e Inadimplência - Grupo US

## Descrição
Dashboard e integração para monitoramento de pagamentos via Asaas, com automação de alertas para Jurídico (30 dias de atraso) e Coordenação (60+ dias de atraso).

## Funcionalidades
1.  **Integração Asaas:** Coleta automática de faturas vencidas.
2.  **Lógica de Cobrança (Jurídico):** Identificação de atrasos de 30 dias para acordos.
3.  **Bloqueio de Acesso (Coordenação):** Identificação de atrasos de 60+ dias para corte de acesso e cancelamento de práticas.
4.  **Interface:** Funil de inadimplência com visualização clara de prioridades.
5.  **Segurança:** Dados sensíveis de alunos são processados via API interna e as permissões de acesso ao dashboard são restritas à Diretoria/Coordenação.

## Próximos Passos
- [ ] Configurar chaves de API Asaas no ambiente seguro (`.env`).
- [ ] Conectar os alertas de WhatsApp com o agente `chat` via `sessions_spawn`.
- [ ] Integrar com o NeonDB para persistência histórica das ações tomadas.
- [ ] Definir endpoints específicos para cada turma/curso no filtro do dashboard.
- [ ] Implementar o gatilho automático de cancelamento de práticas no sistema de agendamentos.

## Estrutura do Código
- `api/asaas.js`: Cliente de integração com a API v3 do Asaas.
- `api/tracker.js`: Lógica de processamento de regras de 30/60 dias.
- `ui/Dashboard.js`: Componente visual do painel de controle.
