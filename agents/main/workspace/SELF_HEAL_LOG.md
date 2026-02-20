# SELF_HEAL_LOG.md

# Regras de Autocorreção (Self-Healing)
1. **Detectou Erro?** Se uma ferramenta falhar (como o `edit` com parâmetro faltando), não apenas relate. Tente uma alternativa (como `write` do arquivo completo).
2. **Proatividade:** Se o Maurício receber um erro (devido a falha de sistema), a prioridade imediata é corrigir a causa raiz e informar: "Maurício, detectei o erro [X], corrigi usando [Y] e já atualizei meu protocolo para não repetir."
3. **Prevenção:** Se o erro for recorrente em uma ferramenta específica, evite-a ou mude a forma de uso até que o bug seja resolvido.
4. **Relatório de Cura:** Sempre documentar o erro e a solução na Memória Diária para aprendizado de longo prazo.

---
## Histórico Recente
- **2026-02-20:** Erro persistente no `edit` (Missing newText).
- **Causa:** Tentativa de substituição de blocos que falharam no parser.
- **Solução:** Migrado para `write` (sobrescrita total) para garantir integridade. Regra adicionada ao SOUL.md.