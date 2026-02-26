#!/usr/bin/env python3
"""
check_leads_pending.py
Detecta leads diretos no WhatsApp cuja última mensagem é do usuário (não respondida).
Retorna JSON com lista de leads pendentes.

Uso: python3 check_leads_pending.py [--hours 2] [--json]
"""
import json, os, sys, argparse
from datetime import datetime, timezone

SESSIONS_FILE = os.path.expanduser('~/.openclaw/agents/main/sessions/sessions.json')
SESSIONS_DIR  = os.path.expanduser('~/.openclaw/agents/main/sessions/')

# Números conhecidos (não são leads)
KNOWN = {
    '+556299776996',  # Maurício
    '+5562981123150', # Raquel
    '+556294705081',  # Laura (próprio número)
    '+5521990869640', # Bruno
    '+556195220319',  # Lucas
    '+556284414105',  # Lucas 2
    '+556299438005',  # Erika
}

def get_pending(max_hours=48):
    with open(SESSIONS_FILE) as f:
        sessions = json.load(f)

    now_ms = datetime.now(timezone.utc).timestamp() * 1000
    pending = []

    for key, session in sessions.items():
        if 'whatsapp:direct' not in key:
            continue
        phone = key.split(':')[-1]
        if phone in KNOWN:
            continue

        sid = session.get('sessionId')
        if not sid:
            continue

        path = os.path.join(SESSIONS_DIR, f'{sid}.jsonl')
        if not os.path.exists(path):
            continue

        updated_ms = session.get('updatedAt', 0)
        hours_ago = (now_ms - updated_ms) / (1000 * 3600)

        # Só considerar sessões ativas nas últimas max_hours horas
        if hours_ago > max_hours:
            continue

        try:
            with open(path, 'rb') as f:
                f.seek(0, 2)
                size = f.tell()
                f.seek(max(0, size - 16000))
                tail = f.read().decode('utf-8', errors='ignore')

            lines = [l for l in tail.strip().split('\n') if l.strip()]
            last_role = None
            last_content = ''

            for line in reversed(lines):
                try:
                    d = json.loads(line)
                    msg = d.get('message', {})
                    role = msg.get('role')
                    if role in ('user', 'assistant'):
                        last_role = role
                        content = msg.get('content', '')
                        if isinstance(content, list):
                            for block in content:
                                if isinstance(block, dict) and block.get('type') == 'text':
                                    last_content = block.get('text', '')[:150]
                                    break
                        elif isinstance(content, str):
                            last_content = content[:150]
                        break
                except:
                    continue

            if last_role == 'user':
                pending.append({
                    'phone': phone,
                    'session_key': key,
                    'hours_ago': round(hours_ago, 1),
                    'last_msg': last_content
                })
        except Exception:
            pass

    pending.sort(key=lambda x: x['hours_ago'])
    return pending


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--hours', type=float, default=48,
                        help='Janela de horas para verificar (padrão: 48)')
    parser.add_argument('--json', action='store_true',
                        help='Saída em JSON puro')
    args = parser.parse_args()

    pending = get_pending(max_hours=args.hours)

    if args.json:
        print(json.dumps(pending, ensure_ascii=False))
    else:
        if not pending:
            print("✅ Nenhum lead aguardando resposta.")
        else:
            print(f"🚨 {len(pending)} lead(s) aguardando resposta:\n")
            for p in pending:
                print(f"  📱 {p['phone']} | {p['hours_ago']}h atrás")
                print(f"     Última msg: \"{p['last_msg']}\"")
                print()
