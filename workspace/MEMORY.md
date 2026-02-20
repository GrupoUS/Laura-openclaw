# MEMORY.md - Memória de Longo Prazo

## Configuração Inicial
- **Data:** 27/01/2026
- **Identidade:** Laura, agente do Grupo US
- **Modos:** SDR (pré-vendas) + Suporte (alunos/clientes)

## Grupo US - Contexto
- Ecossistema educacional na área de saúde/estética
- Foco: formação técnica, gestão de clínica, vendas éticas
- Público: profissionais de saúde (odonto, enfermagem, biomed, fisio, etc.)

## Preferências de Comunicação
- Quando Maurício disser **"grupo da diretoria"**, refere-se ao WhatsApp **whatsapp:g-us-diretoria** (nome: **US - Diretoria**).

## Pessoas Autorizadas

### Administrador Master
- **Maurício Magalhães** — Dono / CEO — +55 62 9977-6996
- **Sacha Gualberto** — CVO / Esposa do Maurício — +55 62 9971-4524

### Sobre a Sacha
- Responsável por criar conteúdo e dar as aulas
- Rosto público do Grupo US
- Acesso total (mesmo nível do Maurício)

### Funcionários
*(ver AUTORIZACOES.md para lista completa)*

---

## Integrações Google (configurado 27/01/2026)

### Conta conectada
- **Email:** suporte@drasacha.com.br

### Serviços ativos
- ✅ **Gmail** — ler e enviar emails
- ✅ **Google Calendar** — ver e criar eventos
- ✅ **Google Drive** — ler arquivos e documentos
- ✅ **Google Places API** — buscar locais

### Calendários disponíveis
- GRUPO US
- TRINTAE3
- COMU US
- NEON
- OTB
- Feriados no Brasil

### Como usar (via MCP)
```bash
# Listar emails
mcporter call google-workspace.gmail_list_emails hours:24

# Buscar arquivos no Drive
mcporter call google-workspace.drive_search_files query:"name contains 'relatório'"

# Listar eventos do calendário
mcporter call google-workspace.calendar_list_events days:7
```

### Arquivos de configuração
- Token: `/Users/mauricio/.openclaw/config/google-token.json`
- MCP: `/Users/mauricio/.openclaw/config/mcporter.json`
- Helper: `/Users/mauricio/.openclaw/scripts/google-services.js`

---

## Skills Ativas (13 prontas)

### Integradas com Google
- 📍 **goplaces** — Buscar locais (Places API)
- 📍 **local-places** — Places API local
- 🍌 **nano-banana-pro** — Gerar imagens com Gemini

### Comunicação
- 📦 **bluebubbles** — iMessage (se configurar)
- 📦 **slack** — Controlar Slack
- 📦 **mcporter** — MCP servers (Google Workspace)

### Produtividade
- 📦 **github** — GitHub CLI
- 📝 **notion** — Notion API
- 🧿 **oracle** — Oracle CLI

### Utilitários
- 🌤️ **weather** — Previsão do tempo
- 📦 **clawdhub** — Gerenciar skills
- 📦 **skill-creator** — Criar skills
- 🧵 **tmux** — Sessões interativas

---

## Busca Vetorial RAG (configurado 28/01/2026)

### REGRA OBRIGATÓRIA
**SEMPRE usar busca vetorial antes de responder sobre:**
- Informações da empresa (Grupo US, produtos, processos)
- Dados de alunos, turmas, progresso
- Projetos, eventos, cronogramas
- Documentos, contratos, procedimentos

### Como Buscar
```bash
# Busca unificada (Drive + Notion)
node /Users/mauricio/.openclaw/scripts/rag-search.js search "termo de busca"

# Ver estatísticas
node /Users/mauricio/.openclaw/scripts/rag-search.js stats
```

### Sistema RAG - Universal Data System (UDS)
- **Backend:** PostgreSQL 17 + pgvector 0.8.0 + busca híbrida (BM25 + vector + RRF)
- **API:** http://127.0.0.1:8000
- **Status:** Operacional (02/02/2026)

### Fontes Indexadas
**Google Drive:**
- 10.978 arquivos indexados automaticamente
- Watch channel ativo para atualizações em tempo real
- Documentos, planilhas, apresentações, PDFs

**Notion:** (pausado - migração futura)

### Indexação Automática
- Gerenciada pelo UDS via Docker
- Watch channel: atualiza automaticamente quando arquivos mudam no Drive
- Bootstrap inicial: `python scripts/bootstrap_index.py --all`

---

## Preferências de Modelos (configurado 27/01/2026)

### Regra Principal
**SEMPRE usar os modelos mais recentes e avançados disponíveis.**

Quando novos modelos forem lançados, atualizar a configuração automaticamente.

### Configuração Atual (27/01/2026)
| Prioridade | Modelo | Provider |
|------------|--------|----------|
| 1º (Primary) | claude-opus-4-5-thinking | google-antigravity |
| 2º (Fallback) | gemini-3-pro-high | google-antigravity |
| 3º (Fallback) | gpt-5.2-codex | github-copilot |

### Hierarquia de Preferência
1. **Claude Opus** (mais avançado disponível) — raciocínio profundo
2. **Gemini Pro** (versão mais alta: high > low) — multimodal rápido
3. **GPT Codex** (versão mais recente: 5.2 > 5.1 > 5.0) — fallback OpenAI

### Como Atualizar
Quando sair um modelo novo (ex: Claude Opus 5, Gemini 4, GPT-6):
```bash
openclaw models list --all | grep "<provider>"
# Atualizar via config.patch no gateway
```

---

## 📅 Feriados Nacionais 2026 (NÃO AGENDAR CALLS)

**⚠️ IMPORTANTE:** Verificar esta lista antes de agendar qualquer reunião ou call.

- **01/01 (qui):** Confraternização Universal
- **16/02 (seg):** Carnaval
- **17/02 (ter):** Carnaval
- **03/04 (sex):** Paixão de Cristo
- **21/04 (ter):** Tiradentes
- **01/05 (sex):** Dia do Trabalho
- **04/06 (qui):** Corpus Christi
- **07/09 (seg):** Independência do Brasil
- **12/10 (seg):** Nossa Senhora Aparecida
- **02/11 (seg):** Finados
- **20/11 (sex):** Consciência Negra
- **25/12 (sex):** Natal

---

## 🧠 Auto-Improvement - Regras

### Princípio Fundamental
> "Aprenda, documente, melhore. Sempre."

### O que Documentar Aqui (MEMORY.md)
- ✅ Regras de negócio descobertas
- ✅ Preferências do Maurício
- ✅ Padrões de atendimento que funcionam
- ✅ Informações importantes sobre produtos
- ✅ Lições aprendidas de erros
- ✅ Insights estratégicos

### O que NÃO Documentar Aqui
- ❌ Logs de atendimentos individuais (usar memory/YYYY-MM-DD.md)
- ❌ Dados sensíveis de alunos
- ❌ Informações temporárias

### Ciclo de Melhoria Contínua
```
1. INTERAGIR → Com leads, alunos, funcionários
2. APRENDER  → Identificar padrões, problemas, soluções
3. DOCUMENTAR → Em memory/, agents/, MEMORY.md
4. APLICAR   → Nas próximas interações
5. REPETIR   → Voltar ao passo 1
```

### Fontes de Aprendizado
- **Leads:** Objeções, dúvidas, motivações
- **Alunos:** Problemas, feedback, sugestões
- **Funcionários:** Processos, regras, exceções
- **Maurício:** Preferências, estratégias, prioridades

---

## 📁 Arquivos de Agentes

| Agente | Arquivo | Função |
|--------|---------|--------|
| SDR | `/Users/mauricio/.openclaw/agents/SDR.md` | Pré-vendas |
| SUPORTE | `/Users/mauricio/.openclaw/agents/SUPORTE.md` | Atendimento |
| CS | `/Users/mauricio/.openclaw/agents/CS.md` | Sucesso do cliente |
| CODER | `/Users/mauricio/.openclaw/agents/CODER.md` | Desenvolvimento |

**Regra:** Ao aprender algo que melhora um agente, atualizar o arquivo dele.

---

## 📊 Aprendizados por Categoria

### Objeções de Vendas
*(Adicionar objeções novas e respostas que funcionam)*

### Problemas de Suporte
*(Adicionar problemas recorrentes e soluções)*

### Informações de Produtos
- **Pós-Graduação TRINTAE3:**
    - **Duração:** **6 MESES** (Intensiva). Diferencial de mercado.
    - **Formato:** Híbrido (Teoria Online + Prática Presencial em Goiânia).
    - **Público:** Biomédicos, Enfermeiros, Farmacêuticos, Dentistas, Fisioterapeutas.
    - **Prática:** Pacientes reais (Clínica-Escola).

### Regras de Negócio (SDR & Vendas - Lucas)
- **Horários de Atendimento:** 09:20 às 12:00 e 13:20 às 17:00.
- **Fluxo de Agendamento (NOVO):**
    - **Dentro do Horário:** Perguntar "Vou pedir pro nosso especialista te ligar agora, tudo bem?". Se "Sim" -> Distribuir imediatamente.
    - **Fora do Horário:** Dizer "Assim que puder, um dos nossos especialistas vai falar com você, qual melhor horário pra falar com você?". Quando responder -> Distribuir.
    - **Vácuo (Ghosting):** Se o lead parar de responder *após qualificação*, distribuir com obs "Parou de responder durante a qualificação".
- **Distribuição (Round Robin):** Alternar entre **Lucas** e **Erica**.
    - **Vez do Lucas:** Enviar lead para Lucas ("Lead qualificado para o Lucas").
    - **Vez da Erica:** Enviar lead para Erica E notificar Lucas ("Lead Qualificado para a Erica").
    - **NÃO USAR Google Calendar** para esses agendamentos (conexão direta).
- **Notificações Lucas:** Avisar sempre sobre Novo Lead, Lead Qualificado, Distribuição.
- **Confirmação de Call:** (Regra suspensa pois agora é ligação imediata/direta).

### Feedback de Alunos
*(Adicionar padrões de feedback)*

---

*Atualizar com aprendizados importantes.*
