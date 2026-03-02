#!/usr/bin/env python3
"""
check_stalled_leads.py
Detecta leads que receberam resposta da Laura mas NÃO RESPONDERAM de volta.
Esses leads precisam de follow-up proativo.

Retorna JSON com lista de leads travados.

Uso: python3 check_stalled_leads.py [--min-hours 1] [--max-hours 72] [--json]
"""
import json, os, sys, argparse
from datetime import datetime, timezone

SESSIONS_FILE = os.path.expanduser('~/.openclaw/agents/main/sessions/sessions.json')
SESSIONS_DIR  = os.path.expanduser('~/.openclaw/agents/main/sessions/')

KNOWN = {
    '+556299776996',  # Maurício
    '+5562981123150', # Raquel
    '+556294705081',  # Laura (próprio número)
    '+5521990869640', # Bruno
    '+556195220319',  # Lucas
    '+556284414105',  # Lucas 2
    '+556299438005',  # Tânia
    '+556199574354',  # Érica
    '+556299971452',  # Sacha
    '+556298112315',  # Raquel alt
    # Test leads
    '+5562999990002',
    '+5562999990099',
}

def get_stalled(min_hours=1, max_hours=72):
    with open(SESSIONS_FILE) as f:
        sessions = json.load(f)

    now_ms = datetime.now(timezone.utc).timestamp() * 1000
    stalled = []

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
        hours_since_update = (now_ms - updated_ms) / (1000 * 3600)

        # Only consider sessions updated within max_hours
        if hours_since_update > max_hours:
            continue
        # Minimum gap to avoid sending too soon
        if hours_since_update < min_hours:
            continue

        try:
            with open(path, 'rb') as f:
                f.seek(0, 2)
                size = f.tell()
                f.seek(max(0, size - 20000))
                tail = f.read().decode('utf-8', errors='ignore')

            lines = [l for l in tail.strip().split('\n') if l.strip()]
            msgs = []

            for line in lines:
                try:
                    d = json.loads(line)
                    msg = d.get('message', {})
                    role = msg.get('role')
                    content = msg.get('content', '')
                    if isinstance(content, list):
                        for block in content:
                            if isinstance(block, dict) and block.get('type') == 'text':
                                content = block.get('text', '')
                                break
                    elif not isinstance(content, str):
                        content = ''
                    if role in ('user', 'assistant'):
                        msgs.append({'role': role, 'content': content[:200]})
                except:
                    continue

            if not msgs:
                continue

            last_role = msgs[-1]['role']
            user_count = sum(1 for m in msgs if m['role'] == 'user')
            asst_count = sum(1 for m in msgs if m['role'] == 'assistant')

            # Stalled = Laura's message is last (lead didn't respond back)
            # AND the conversation had at least 1 user message (real lead)
            # AND not too many exchanges (not completed/handed off)
            if last_role == 'assistant' and user_count >= 1 and len(msgs) <= 20:
                # Get last assistant message
                last_asst_msg = next(
                    (m['content'][:150] for m in reversed(msgs) if m['role'] == 'assistant'), ''
                )
                # Get first user message for context
                first_user_msg = next(
                    (m['content'][:150] for m in msgs if m['role'] == 'user'), ''
                )

                # Skip if already handed off (these don't need SDR follow-up)
                handoff_signals = ['consultor', 'lucas', 'erica', 'já avisamos', 'nossa equipe',
                                   'vai entrar em contato', 'obrigada', 'obrigado']
                if any(sig in last_asst_msg.lower() for sig in handoff_signals):
                    continue

                # Determine follow-up timing bucket
                if hours_since_update < 2:
                    bucket = 'followup_30min'
                elif hours_since_update < 6:
                    bucket = 'followup_2h'
                elif hours_since_update < 26:
                    bucket = 'followup_24h'
                else:
                    bucket = 'followup_48h'

                stalled.append({
                    'phone': phone,
                    'session_key': key,
                    'hours_ago': round(hours_since_update, 1),
                    'bucket': bucket,
                    'total_msgs': len(msgs),
                    'user_msgs': user_count,
                    'asst_msgs': asst_count,
                    'first_msg': first_user_msg,
                    'last_asst_msg': last_asst_msg,
                })
        except Exception:
            pass

    stalled.sort(key=lambda x: x['hours_ago'])
    return stalled


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--min-hours', type=float, default=1,
                        help='Mínimo de horas sem resposta (padrão: 1)')
    parser.add_argument('--max-hours', type=float, default=72,
                        help='Máximo de horas sem resposta (padrão: 72)')
    parser.add_argument('--json', action='store_true',
                        help='Saída em JSON puro')
    args = parser.parse_args()

    stalled = get_stalled(min_hours=args.min_hours, max_hours=args.max_hours)

    if args.json:
        print(json.dumps(stalled, ensure_ascii=False))
    else:
        if not stalled:
            print("✅ Nenhum lead travado encontrado.")
        else:
            print(f"🔁 {len(stalled)} lead(s) travado(s) (Laura perguntou, lead sumiu):\n")
            for p in stalled:
                print(f"  📱 {p['phone']} | {p['hours_ago']}h | {p['bucket']}")
                print(f"     Última pergunta Laura: \"{p['last_asst_msg'][:80]}\"")
                print()
