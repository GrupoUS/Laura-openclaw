# ORGANOGRAMA.md - Estrutura Grupo US

## 🏛️ Grupos de WhatsApp (IDs)

| Nome do Grupo | ID do WhatsApp | Descrição / Contexto |
|---------------|----------------|----------------------|
| **US - Diretoria** | `120363394424970243@g.us` | Grupo de Coordenação e Monitoramento (Alta Prioridade) |
| **US - COMERCIAL** | `120363361363907454@g.us` | Novos leads, relatórios de follow-up e estratégia de vendas |
| **US - Coordenação TRINTAE3** | `120363174134875759@g.us` | Grupo de Coordenação Operacional e Estratégica da Pós |
| **Jurídico GRUPO US** | `120363285625757349@g.us` | Cobrança e resolução de inadimplência — Relatório diário 10h (seg-sex) |

---

## 🤖 Identidade da Laura (EU MESMA)

> ⚠️ NUNCA enviar mensagens para estes números — sou EU:
- **Meu WhatsApp:** `+556294705081` (`556294705081@s.whatsapp.net`)

---

## 👥 Equipe e Funções

### Maurício Magalhães
- **Cargo:** Administrador Master / Dono do Grupo US
- **ID/Contato:** `+556299776996` (WhatsApp)

### Erika
- **Cargo:** Consultora Comercial
- **Responsabilidades:** Atendimento de leads e fechamento.
- **ID/Contato:** `+556299438005` (WhatsApp)

### Raquel
- **Cargo:** Coordenadora de Produtos
- **Responsabilidades:** Gestão da grade acadêmica, entrega dos cursos, suporte aos alunos e qualidade do conteúdo entregue.
- **ID/Contato:** ⚠️ *Verificar número correto com Maurício — não confundir com o número da Laura*

### Lucas
- **Cargo:** Head de Vendas
- **Responsabilidades:** Gestão do time comercial, fechamento de matrículas, acompanhamento de metas de vendas (Pós e Mentoria).
- **ID/Contato:** `+556195220319` (Confirmado em memory/2026-02-21.md)
- **ID Adicional:** `+556284414105` (WhatsApp)

---

## 🛠️ Notas de Operação

- **Cobranças:** Sempre verificar o cargo antes de realizar cobranças proativas via Heartbeat ou Cron.
- **Canais:**
  - Novos leads e relatórios de vendas/follow-up → US - COMERCIAL `120363361363907454@g.us` (agente `sdr`)
  - Decisões estratégicas → Grupo Diretoria
  - Relatório de inadimplentes (simplificado) → Grupo Coordenação TRINTAE3 (agente `suporte`, diário 10h seg-sex)
  - Relatório de cobrança completo → Grupo Jurídico (agente `suporte`, diário 10h seg-sex)

## 📋 Scripts Ativos (Agente Suporte)

- `student-parser/parser.mjs` — Sync de alunos a cada 6h (cron: `0 */6 * * *`)
- `student-parser/daily_report.sh` — Inadimplentes → Coordenação (cron: `0 10 * * 1-5`)
- `student-parser/juridico_report.sh` — Cobrança completo → Jurídico (cron: `0 10 * * 1-5`)
- Base: NeonDB tabela `students` | 278 alunos | Turma 4 / Curso 33
