# HEARTBEAT.md

## ✅ Checklist de Heartbeat

### 1. Leads sem resposta (OBRIGATÓRIO — verificar todo ciclo)
```bash
python3 /Users/mauricio/.openclaw/agents/main/workspace/scripts/check_leads_pending.py --hours 6
```
- Se houver leads: enviar mensagem SDR de abertura para cada número pendente
- Usar fluxo padrão: "Oi! 💜 Sou a Laura, do Grupo US..."
- NÃO notificar Maurício sobre isso — apenas agir

### 2. Follow-up de leads (verificar se passaram 2h/24h/48h sem resposta)
- Usar mesma saída do script acima
- Se `hours_ago >= 2` e última mensagem foi minha (assistente) → sem ação
- Se `hours_ago >= 2` e última mensagem é do lead → enviar follow-up com meme

### 3. Sync de arquivos do Dashboard (a cada 10 ciclos)
- Se algum arquivo foi editado pelo dashboard → sincronizar para local
- `node /Users/mauricio/.openclaw/agents/main/workspace/scripts/sync_agent_files.js`
- Log: reportar se houve mudanças

### Regras de silêncio
- Não enviar nada entre 23:00 e 08:00 (horário Brasília)
- Finais de semana: leads novos = responder; follow-up proativo = não
