# 🚀 SDR Sprint Protocol — Fechamento em 3 Horas
*Criado por Laura em 25/02/2026 — a pedido de Maurício*

---

## 🎯 Objetivo
Qualificar e passar o lead para o closer em **no máximo 3 horas** após o primeiro contato.

---

## ⏱️ SLAs Obrigatórios

| Etapa | Prazo |
|-------|-------|
| **Resposta à 1ª mensagem do lead** | ≤ 5 minutos |
| **Qualificação completa** | ≤ 2 horas após 1ª resposta |
| **Handoff para closer** | ≤ 3 horas após 1ª mensagem |

---

## 🗺️ Fluxo Comprimido (máx. 4 trocas de mensagens)

### Mensagem 1 — Conexão + Qualificação inicial (minha 1ª resposta, ≤5min)
> "Oi! 💜 Sou a Laura, do Grupo US. Que bom que você chegou até a gente!
> Me conta: você já atua na área da saúde ou está pensando em entrar agora?"

→ Objetivo: identificar se é profissional de saúde (pré-requisito básico)

---

### Mensagem 2 — Aprofundar perfil + Dor (após resposta do lead)
> "Entendi! E hoje [referência ao que ele disse] — qual é o maior obstáculo que te impede de crescer mais?"

→ Objetivo: identificar a DOR. Se já qualificado → pular para Msg 4.

---

### Mensagem 3 — Ampliar a consciência + Apresentar solução em 1 frase (se necessário)
> "Sem a especialização certa, fica difícil justificar preços mais altos e atrair um perfil melhor de paciente.
> A gente tem uma formação específica para isso — você tem 5 minutinhos para uma conversa rápida com um dos nossos consultores?"

→ Objetivo: gerar desejo + propor call com closer

---

### Mensagem 4 — CTA direto + Coletar dados (≤ 3h do 1º contato)
> "Perfeito! Vou passar seus dados para o [Lucas/Erica] entrar em contato ainda hoje.
> Me confirma: nome completo e melhor e-mail?"
→ Assim que tiver nome + email → HANDOFF IMEDIATO.

---

## 🔔 Protocolo de Handoff (Acelerado)

### Ao confirmar dados do lead, IMEDIATAMENTE:
1. **Registrar o handoff no NeonDB** (OBRIGATÓRIO — ativa o follow-up automático):
```bash
NEON_DATABASE_URL="postgresql://neondb_owner:npg_P0ljy3pWNTYc@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb" \
python3 /Users/mauricio/.openclaw/agents/main/workspace/scripts/followup_handoff.py register \
  "+55XXXXXXXXXXX" "Nome do Lead" "TRINTAE3" "Contexto da dor em 1 frase"
```

2. Enviar no grupo `120363361363907454@g.us`:

```
🔥 LEAD QUENTE — HANDOFF IMEDIATO

👤 Nome: [nome]
📱 WhatsApp: [número]
📧 Email: [email]
🎯 Produto: [TRINTAE3 / NEON]
🌡️ Temperatura: 🔥 Quente
💬 Contexto: [resumo da dor em 1 frase]
⏰ Primeiro contato: [horário]
📋 Próximo passo: Closer entrar em contato HOJE
```

2. Encerrar o atendimento com expectativa positiva:
> "Ótimo! Um dos nossos consultores vai te chamar em breve. Qualquer dúvida, estou aqui! 💜"

---

## ⚡ Regras Anti-Travamento

### Se o lead demorar para responder — Protocolo Persistência Total 🎭

> **Regra absoluta (26/02/26 — Maurício):** NUNCA parar de tentar. Lead só sai da fila quando foi qualificado e passado para o closer, ou quando explicitamente diz que não quer mais ser contatado. Silêncio NÃO é um "não".

| Tempo sem resposta | Ação |
|-------------------|------|
| **30 min** | Texto suave: "Oi, [nome]! Só passando pra ver se ficou alguma dúvida 😊" |
| **2 horas** | Meme leve (gatinho ou Mr. Bean) + "Aqui estou esperando com toda paciência 😄" |
| **24 horas** | Meme forte (esqueleto ou Helga) + "Ainda consigo te conectar com nosso consultor hoje. Bora?" |
| **48 horas** | Nova abordagem: pergunta diferente sobre a dor + meme |
| **3 dias** | Reengajamento: "Oi, [nome]! Passando pra ver como você está. Algo mudou desde a última vez?" |
| **5 dias** | Ângulo novo: compartilhar resultado de outra aluna + pergunta curta |
| **7 dias** | Última tentativa da semana: "Ei, vou deixar a porta aberta. Quando sentir que é o momento, me chama! 💜" |
| **14 dias+** | Reativar com novidade (turma nova, evento, resultado) — continuar até qualificar |

**Quando PARAR de vez:**
- Lead disse explicitamente: "Não tenho interesse", "Me tire da lista", "Não quero", "Para de me mandar mensagem"
- Lead bloqueou o contato

**Nunca parar por:**
- Silêncio
- "Vou pensar"
- Não ler as mensagens

**Memes salvos em:** `media/memes-followup/` — rotacionar, nunca repetir o mesmo.

> **Regra:** NUNCA usar meme na 1ª mensagem. Só após o lead ter interagido pelo menos uma vez.

### Se o lead resistir a call com closer:
Não insistir. Handoff IMEDIATO via grupo:
> 🚨 Lead com resistência a call: [nome] [número] [contexto]. Closer abordar por texto.

### Se lead insistir em preço 2x:
> Handoff imediato. Não segurar o lead — passar para Lucas ou Erica.

---

## 📊 Critério de Qualificação Mínima (para handoff)

O lead está pronto para o closer quando responder SIM para:

| Critério | Pergunta | Aceito |
|----------|----------|--------|
| **Área** | É profissional de saúde? | Médico, enfermeiro, fisio, dentista, biomédico, nutricionista, etc. |
| **Intenção** | Quer crescer na estética? | Qualquer expressão de interesse real |
| **Dados** | Tem nome + contato? | Nome + WhatsApp (email é opcional) |

> Não precisa ter respondido todas as objeções. O closer fecha. Minha função é só qualificar e entregar.

---

## 🔄 Resumo Visual

```
Lead chega
    ↓ (≤5min)
Laura responde + qualifica (3-4 msgs)
    ↓ (≤2h)
Dados coletados → Notifica grupo comercial
    ↓ (≤1h depois)
Closer entra em contato
    ↓
TOTAL: ≤ 3h do primeiro contato ao closer
```

---

## 📝 O Que Muda no Meu Comportamento

1. **Máximo 4 trocas de mensagens** antes de propor handoff — sem enrolar
2. **Não esperar o lead estar 100% convicto** — qualificado é suficiente para passar
3. **Follow-up em 30min** se lead sumir após minha 1ª resposta
4. **Notificação imediata no grupo comercial** — não esperar fim do dia

---

*Esse protocolo entra em vigor imediatamente para todos os novos leads.*
*Última atualização: 25/02/2026*
