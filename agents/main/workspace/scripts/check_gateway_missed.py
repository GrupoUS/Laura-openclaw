#!/usr/bin/env python3
"""
check_gateway_missed.py
Detecta mensagens inbound no gateway.log que não têm sessão correspondente
ou cujas sessões não têm o user message registrado.
Retorna lista de números que precisam de resposta imediata.
"""
import json, os, re
from datetime import datetime, timezone, timedelta

GATEWAY_LOG = os.path.expanduser('~/.openclaw/logs/gateway.log')
SESSIONS_FILE = os.path.expanduser('~/.openclaw/agents/main/sessions/sessions.json')
SESSIONS_DIR = os.path.expanduser('~/.openclaw/agents/main/sessions/')

KNOWN = {
    '+556299776996', '+5562981123150', '+556294705081', '+5521990869640',
    '+556195220319', '+556284414105', '+556299438005', '+556299971452',
    '+556199574354', '+556298112315', '+5562999990002', '+5562999990099',
}

def get_missed(hours=6):
    """Lê gateway.log e encontra inbound messages sem resposta registrada."""
    try:
        with open(GATEWAY_LOG) as f:
            lines = f.readlines()
    except:
        return []

    with open(SESSIONS_FILE) as f:
        sessions = json.load(f)

    now_dt = datetime.now(timezone.utc)
    cutoff = now_dt - timedelta(hours=hours)

    # Parse inbound messages from log
    inbound = {}  # phone -> {'ts': datetime, 'count': int}
    pattern = re.compile(r'(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\s+\[whatsapp\] Inbound message (\+\d+) -> .* \(direct')

    for line in lines:
        m = pattern.search(line)
        if not m:
            continue
        try:
            ts_str = m.group(1)
            phone = m.group(2)
            # Parse timestamp
            ts_str = ts_str.rstrip('Z') + '+00:00' if ts_str.endswith('Z') else ts_str
            ts = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
        except:
            continue

        if phone in KNOWN:
            continue
        if ts < cutoff:
            continue

        if phone not in inbound or ts > inbound[phone]['ts']:
            inbound[phone] = {'ts': ts, 'count': inbound.get(phone, {}).get('count', 0) + 1}
        else:
            inbound[phone]['count'] += 1

    # For each inbound phone, check if session has assistant response
    missed = []
    for phone, data in inbound.items():
        hours_ago = (now_dt - data['ts']).total_seconds() / 3600

        # Find session
        session_key = None
        for key in sessions:
            if phone.replace('+','') in key or phone in key:
                session_key = key
                break

        has_response = False
        if session_key:
            sid = sessions[session_key].get('sessionId')
            if sid:
                path = os.path.join(SESSIONS_DIR, f'{sid}.jsonl')
                if os.path.exists(path):
                    content = open(path).read()
                    # Check if there's an assistant message AFTER the inbound
                    has_response = '"role": "assistant"' in content or '"role":"assistant"' in content

        if not has_response:
            missed.append({
                'phone': phone,
                'hours_ago': round(hours_ago, 2),
                'msg_count': data['count'],
                'last_inbound': data['ts'].isoformat()
            })

    missed.sort(key=lambda x: x['hours_ago'])
    return missed


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--hours', type=float, default=6)
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args()

    missed = get_missed(hours=args.hours)
    if args.json:
        print(json.dumps(missed, ensure_ascii=False))
    else:
        if not missed:
            print("✅ Nenhuma mensagem perdida encontrada no gateway.")
        else:
            print(f"🚨 {len(missed)} mensagem(ns) inbound sem resposta:\n")
            for r in missed:
                print(f"  ⚠️  {r['hours_ago']}h | {r['phone']} | {r['msg_count']} msgs")
