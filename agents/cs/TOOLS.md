# TOOLS.md - CS + Suporte ao Aluno

## Quick Reference

### Buscar Aluno na Kiwify
```bash
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py search "email@aluno.com"
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py search "+5562999999999"
python3 /Users/mauricio/.openclaw/scripts/kiwify_cli.py products
```

### Buscar no RAG (Documentação e FAQs)
```bash
python3 /Users/mauricio/.openclaw/workspace/skills/uds-search/scripts/uds-search.py search "termo do problema"
```

### Buscar Cronogramas
```bash
python3 /Users/mauricio/.openclaw/workspace/skills/uds-search/scripts/uds-search.py search "cronograma TRINTAE3"
```

### Testar Conexão Google
```bash
node /Users/mauricio/.openclaw/scripts/test-google.js
```

---

## APIs Disponíveis

| Serviço | Uso | Como Acessar |
|---------|-----|--------------|
| **Kiwify** | Status do aluno, progresso, compras | Script kiwify.js |
| **RAG** | Documentação, FAQs, conteúdo | Script rag-search.js |
| **Google Drive** | Pasta do aluno, relatórios | gog drive |
| **Google Calendar** | Agenda de mentorias NEON/OTB | gog calendar |
| **Gmail** | Buscar emails, resumos Zoom | gog gmail |

---

## Pastas Importantes (Drive)

| Pasta | ID | Uso |
|-------|----|-----|
| **Mentorados NEON** | 1gp048ac6i47AKL4vGzBD-RoAi43FoXkJ | Pasta oficial de acompanhamento |
| **Alunos Grupo US** | 1m0i53TKiGHtCC05zRKEc-snhyBZnmX75 | Dados de alunos por produto |
| **Exportação Kiwify** | 1i4CCfdMeQ2cafR73FIpDFMF-Xhdo-fA0 | Relatórios exportados |
| **Documentos (RAG)** | 1VlwI4ogZQx8QOoGr69ug5TF-bErTTNFc | Base de conhecimento |

---

## Estrutura de Relatórios

### Template de Relatório de Evolução
```markdown
# RELATÓRIO DE EVOLUÇÃO - [NOME]

## Status Atual
- **Fase:** [Onboarding/Engajamento/Sucesso/Expansão]
- **Progresso:** [X]%
- **Último acesso:** [Data]

## Diagnóstico
- **Pontos fortes:** ...
- **Oportunidades:** ...
- **Bloqueios:** ...

## Próximos Passos
1. ...
2. ...
3. ...
4. ...

## Oportunidades de Expansão
- [ ] Upsell para [Produto]?
- [ ] Cross-sell [Complemento]?

---
*Gerado em: [Data]*
```

---

## Skills Disponíveis

### gog-workspace (Google Workspace)
**Path:** `/Users/mauricio/.openclaw/workspace/skills/gog-workspace/SKILL.md`

**Usar para:**
- Agendar mentorias no Calendar
- Enviar emails de check-in para alunos
- Acessar relatórios no Drive
- Buscar emails com resumos do Zoom

**Comandos principais:**
```bash
# Ver agenda de hoje (mentorias)
gog calendar events --all --today --json

# Ver agenda da semana
gog calendar events --all --week --json

# Enviar email de check-in (PEDIR CONFIRMAÇÃO)
gog gmail send --to aluno@email.com --subject "Como está seu progresso?" --body "..."

# Buscar relatórios no Drive
gog drive search "relatório evolução" --max 10 --json

# Ler planilha de acompanhamento
gog sheets get <sheetId> "Tab!A1:D10" --json

# Buscar resumos Zoom no email
gog gmail search 'subject:("Zoom Summary" OR "Resumo da Reunião") newer_than:7d' --max 10 --json
```

### zoom
**Path:** `/Users/mauricio/.openclaw/workspace/skills/zoom/SKILL.md`

**Usar para:**
- Agendar check-ins com alunos
- Recuperar resumos de calls anteriores (AI Companion)

**Comandos:**
```bash
# Criar reunião de check-in
python3 /Users/mauricio/.openclaw/scripts/zoom_cli.py create-meeting "Check-in [Aluno]" "2026-02-15T10:00:00" 30

# Ver resumo de reunião (pontos principais)
python3 /Users/mauricio/.openclaw/scripts/zoom_cli.py get-summary <meetingId>
```

### notion
**Path:** `/Users/mauricio/.openclaw/workspace/skills/notion/SKILL.md`

**Usar para:**
- Consultar cronogramas e jornada do aluno
- Extrair conteúdo para relatórios
- Converter playbooks e cronogramas para Markdown

---

## Contatos para Comunicação

| Quem | Contato | Quando |
|------|---------|--------|
| **Renata (CS Lead)** | Slack | Insatisfação grave, reembolsos |
| **Lucas (Comercial)** | +556195220319 | Oportunidades de upsell |
| **Suporte Interno** | sessions_spawn("suporte") | Busca de documentos internos |
| **Financeiro** | #financeiro (Slack) | Pagamento, reembolso |
| **Maurício** | +5562999776996 | Decisões estratégicas |

---

## Scripts Úteis

| Script | Uso |
|--------|-----|
| `/Users/mauricio/.openclaw/scripts/kiwify.js` | API Kiwify |
| `/Users/mauricio/.openclaw/scripts/rag-search.js` | Busca vetorial |
| `/Users/mauricio/.openclaw/scripts/google-services.js` | Google Workspace |
| `/Users/mauricio/.openclaw/scripts/zoom.js` | Zoom API |

---

*Última atualização: 2026-02-14*
