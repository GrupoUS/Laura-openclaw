# HEARTBEAT.md - Tarefas Periódicas

## 📊 Verificar Saúde do RAG (UDS)
Sempre execute para confirmar que o sistema está online:
```bash
node /Users/mauricio/.openclaw/scripts/rag-search.js stats
```

**Esperado:** `"status": "online"`

Se offline, notificar Maurício uma vez (não repetir se já foi notificado).

## 🧠 Auto-Improvement
A cada heartbeat, verificar se há novas informações para:
1. Atualizar MEMORY.md com insights relevantes
2. Melhorar prompts dos agentes em `/Users/mauricio/.openclaw/agents/`
3. Documentar padrões de atendimento que funcionam

## 📝 Nota sobre Indexação
A indexação agora é gerenciada automaticamente pelo **Universal Data System (UDS)**:
- Watch channel monitora mudanças no Google Drive em tempo real
- Não é necessário rodar indexação manual
- Se precisar reindexar: `cd /Users/mauricio/universal-data-system && docker compose exec api python scripts/bootstrap_index.py --all`

---

**Se nada precisa de atenção:** HEARTBEAT_OK
