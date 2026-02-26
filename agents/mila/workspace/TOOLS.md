# TOOLS.md - Local Notes

## 🎓 Onboarding Automático — Kiwify Webhook

Webhook configurado na Kiwify para disparar mensagem de boas-vindas automaticamente via WhatsApp.

**URL do Webhook:** `https://laura.gpus.me/api/webhooks/kiwify`
**Trigger:** `compra_aprovada`
**Token:** ver variável `KIWIFY_WEBHOOK_TOKEN` no Railway

### Fluxo completo
1. Aluno compra na Kiwify
2. Kiwify faz `POST https://laura.gpus.me/api/webhooks/kiwify` com payload `compra_aprovada`
3. Dashboard valida token e extrai nome + telefone do cliente
4. Registro salvo em `laura_memories` (NeonDB) com `metadata.type = 'new_student'`
5. Mila envia mensagem de boas-vindas automaticamente via WhatsApp (`openclaw message send`)
6. Se o `openclaw` CLI não estiver disponível (Railway), status fica `pending_send` no NeonDB

### Como reenviar mensagens pendentes (fallback)
```bash
# Laura pode chamar periodicamente:
curl -X POST https://laura.gpus.me/api/webhooks/kiwify/flush-pending \
  -H "x-laura-secret: $LAURA_API_SECRET"
```

### Como configurar na Kiwify
1. Painel Kiwify → **Apps** → **Webhooks** → **Criar Webhook**
2. URL: `https://laura.gpus.me/api/webhooks/kiwify`
3. Eventos: marcar `compra_aprovada`
4. Token: o valor definido em `KIWIFY_WEBHOOK_TOKEN` (Railway)

---

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
