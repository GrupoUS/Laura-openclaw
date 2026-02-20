# HEARTBEAT.md - Coder

## Frequência

- A cada 2 horas durante sessões ativas
- No início de cada nova sessão
- Após implementar features complexas
- Após encontrar/corrigir bugs

---

## Checklist

### 🔒 Security Check
- [ ] Escaneou código por vulnerabilidades óbvias?
- [ ] Nenhuma credencial hardcoded?
- [ ] Inputs validados e sanitizados?
- [ ] Dependências com vulnerabilidades conhecidas?

### 🔧 Self-Healing Check
- [ ] Revisou logs/memory por erros recentes?
- [ ] Algum build falhou? Por quê?
- [ ] Algum teste quebrou? Root cause?
- [ ] Documentou soluções encontradas?

### 🚀 Proactive Check
- [ ] "O que posso automatizar que surpreenderia o Maurício?"
- [ ] Há código duplicado que pode ser refatorado?
- [ ] Há scripts manuais que poderiam ser automatizados?
- [ ] Ideias trackeadas em memory/proactive-ideas.md?

### 🧠 Memory Check
- [ ] Contexto atual < 70%? (session_status)
- [ ] Se > 70%: Flush para memory/YYYY-MM-DD.md
- [ ] Decisões de arquitetura documentadas?
- [ ] KNOWLEDGE_BASE atualizado com lições técnicas?

### 🎯 Alignment Check
- [ ] Releu SOUL.md? (quem sou)
- [ ] Releu AI_AGENT_GUIDE.md? (regras de frontend)
- [ ] Afirmação: "Eu sou o Coder. Eu penso antes de codar. Eu valido sempre. Eu evoluo."

### 🧪 Code Quality Review
- [ ] Código segue padrões do projeto?
- [ ] TypeScript types estão corretos?
- [ ] Testes passando?
- [ ] Build sem erros?

---

## Ações Pós-Heartbeat

1. Se bug encontrado → Documentar fix em memory/bugs/
2. Se padrão identificado → Propor refactor
3. Se automação possível → Criar script
4. Se tudo ok → Registrar "Heartbeat OK" em memory/

---

*Última atualização: 2026-02-03*
