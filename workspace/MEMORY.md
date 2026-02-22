# MEMORY.md - Memória de Longo Prazo (Compartilhada)

## Configuração Inicial
- **Data:** 27/01/2026
- **Identidade:** Laura, agente do Grupo US
- **Arquitetura:** 4 agentes (main, suporte, cs, coder)

## Grupo US - Contexto
- Ecossistema educacional em saúde/estética
- Foco: formação técnica, gestão de clínica, vendas éticas
- Público: profissionais de saúde (odonto, enfermagem, biomed, fisio, etc.)

---

## Pessoas Autorizadas

### Administrador Master
- **Maurício Magalhães** — Dono / CEO — +55 62 9977-6996
- **Sacha Gualberto** — CVO / Esposa — +55 62 9971-4524
  - Responsável por conteúdo e aulas. Rosto público do Grupo US.
  - Acesso total (mesmo nível do Maurício).

### Funcionários
*(ver AUTORIZACOES.md e ORGANOGRAMA.md para lista completa)*

---

## Preferências de Comunicação
- **"Grupo da diretoria"** → WhatsApp `120363394424970243@g.us` (US - Diretoria)
- **"Grupo comercial"** → WhatsApp `120363361363907454@g.us` (US - COMERCIAL)

---

## Integrações (configurado 27/01/2026)

### Google Workspace
- **Email:** suporte@drasacha.com.br
- **Serviços:** Gmail ✅, Calendar ✅, Drive ✅, Places ✅
- **Calendários:** GRUPO US, TRINTAE3, COMU US, NEON, OTB

### RAG / UDS
- **Backend:** PostgreSQL 17 + pgvector + busca híbrida
- **API:** http://127.0.0.1:8000
- **Google Drive:** 10.978 arquivos indexados
- **Watch channel:** Atualiza automaticamente

---

## 📅 Feriados Nacionais 2026 (NÃO AGENDAR CALLS)

- 01/01 (qui): Confraternização Universal
- 16-17/02 (seg-ter): Carnaval
- 03/04 (sex): Paixão de Cristo
- 21/04 (ter): Tiradentes
- 01/05 (sex): Dia do Trabalho
- 04/06 (qui): Corpus Christi
- 07/09 (seg): Independência
- 12/10 (seg): Nsa Sra Aparecida
- 02/11 (seg): Finados
- 20/11 (sex): Consciência Negra
- 25/12 (sex): Natal

---

## 📊 Informações de Produtos

### Pós-Graduação TRINTAE3
- **Duração:** 6 MESES (intensiva)
- **Formato:** Híbrido (Teoria Online + Prática Presencial em Goiânia)
- **Público:** Biomédicos, Enfermeiros, Farmacêuticos, Dentistas, Fisioterapeutas
- **Prática:** Pacientes reais (Clínica-Escola)

---

## 📋 Regras de Negócio (SDR & Vendas)

### Horários de Atendimento
- **Lucas/Erika:** 09:20–12:00 e 13:20–17:00

### Fluxo de Agendamento
- **Dentro do Horário:** "Vou pedir pro especialista te ligar agora" → se sim, distribuir
- **Fora do Horário:** "Qual melhor horário?" → agendar e distribuir
- **Ghosting:** Se parou de responder após qualificação → distribuir com obs

### Distribuição (Round Robin)
- Alternar entre **Lucas** e **Erika**
- Vez do Lucas → enviar para Lucas
- Vez da Erika → enviar para Erika E notificar Lucas

---

## 🧠 Auto-Improvement

### O que Documentar Aqui
- ✅ Regras de negócio descobertas
- ✅ Preferências do Maurício / Sacha
- ✅ Padrões que funcionam
- ✅ Lições de erros

### O que NÃO Documentar Aqui
- ❌ Logs individuais (→ memory/YYYY-MM-DD.md)
- ❌ Dados sensíveis de alunos
- ❌ Informações temporárias

### Objeções de Vendas
*(Adicionar objeções novas e respostas que funcionam)*

### Problemas de Suporte
*(Adicionar problemas recorrentes e soluções)*

### Feedback de Alunos
*(Adicionar padrões de feedback)*

---

*Atualizar com aprendizados importantes.*
