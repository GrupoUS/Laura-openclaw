---
name: zoom
description: "Gerenciar reuniões do Zoom, criar eventos e analisar resumos de reuniões via API."
metadata: {"openclaw":{"emoji":"🎥"}}
---

# Zoom Skill

## Visão Geral
Esta skill permite ao agente gerenciar a conta do Zoom do Grupo US, criando reuniões, listando agendamentos e recuperando resumos gerados pelo Zoom AI Companion.

## Comandos Disponíveis

### Listar Reuniões
```bash
node /Users/mauricio/.openclaw/scripts/zoom.js list-meetings
```

### Criar Reunião
```bash
# Formato data: YYYY-MM-DDTHH:MM:SS
node /Users/mauricio/.openclaw/scripts/zoom.js create-meeting "Assunto da Reunião" "2026-02-01T10:00:00" 60
```

### Detalhes da Reunião
```bash
node /Users/mauricio/.openclaw/scripts/zoom.js get-meeting <meetingId>
```

### Resumo da Reunião (AI Companion)
```bash
node /Users/mauricio/.openclaw/scripts/zoom.js get-summary <meetingId>
```

## Melhores Práticas
- **Timezone:** Por padrão, as reuniões são criadas no fuso `America/Sao_Paulo`.
- **AI Summary:** O recurso de resumo depende do Zoom AI Companion estar habilitado e a reunião ter sido gravada/processada.
- **Segurança:** As credenciais estão armazenadas em `config/zoom.json` e o acesso é feito via Server-to-Server OAuth.

## Fluxo Sugerido para o Agente
1. Quando solicitado para marcar uma call, verifique a disponibilidade.
2. Crie a reunião no Zoom.
3. Envie o link gerado para o solicitante.
4. Após a reunião, utilize o comando `get-summary` para extrair os pontos principais e salvar na memória do aluno/projeto.
