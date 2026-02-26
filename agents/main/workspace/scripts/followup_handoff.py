#!/usr/bin/env python3
"""
followup_handoff.py
Registra handoffs e gerencia follow-up automático pós-handoff.

Uso:
  python3 followup_handoff.py register <phone> <name> <product> <context>
  python3 followup_handoff.py check   # lista leads que precisam de follow-up
"""
import sys, os, json
from datetime import datetime, timezone, timedelta

NEON_URL = os.environ.get('NEON_DATABASE_URL', 
    'postgresql://neondb_owner:npg_P0ljy3pWNTYc@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb')

def run_query(query, *args):
    import subprocess, json
    script = f"""
import psycopg2, json, sys
conn = psycopg2.connect("{NEON_URL}")
cur = conn.cursor()
cur.execute({repr(query)}, {repr(args) if args else '()'})
if cur.description:
    cols = [d[0] for d in cur.description]
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    print(json.dumps(rows, default=str))
else:
    print(json.dumps({{"affected": cur.rowcount}}))
conn.commit()
conn.close()
"""
    result = subprocess.run(['python3', '-c', script], capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(result.stderr)
    return json.loads(result.stdout) if result.stdout.strip() else []


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'check'
    
    if cmd == 'register':
        phone = sys.argv[2]
        name = sys.argv[3] if len(sys.argv) > 3 else ''
        product = sys.argv[4] if len(sys.argv) > 4 else ''
        context = sys.argv[5] if len(sys.argv) > 5 else ''
        
        result = run_query(
            "INSERT INTO lead_handoffs (phone, name, product, context) VALUES (%s, %s, %s, %s) "
            "ON CONFLICT DO NOTHING RETURNING id",
            phone, name, product, context
        )
        print(f"✅ Handoff registrado: {name} ({phone}) → {product}")
    
    elif cmd == 'check':
        # Leads que precisam de follow-up
        now = datetime.now(timezone.utc)
        
        results = run_query("""
            SELECT id, phone, name, product, context, handoff_at, followup_1_at, status
            FROM lead_handoffs
            WHERE status NOT IN ('closed', 'contacted', 'reactivated_sent')
            AND handoff_at > NOW() - INTERVAL '30 days'
            ORDER BY handoff_at ASC
        """)
        
        needs_followup = []
        for lead in results:
            handoff_at = datetime.fromisoformat(lead['handoff_at'].replace('Z', '+00:00'))
            hours_since = (now - handoff_at).total_seconds() / 3600
            followup_1 = lead.get('followup_1_at')
            
            action = None
            if not followup_1 and hours_since >= 20:
                action = 'followup_1'  # ~24h após handoff
            elif followup_1 and not lead.get('followup_2_at'):
                f1_at = datetime.fromisoformat(str(followup_1).replace('Z', '+00:00'))
                hours_since_f1 = (now - f1_at).total_seconds() / 3600
                if hours_since_f1 >= 20:
                    action = 'followup_2'  # 24h após o 1º follow-up
            
            if action:
                lead['action'] = action
                lead['hours_since_handoff'] = round(hours_since, 1)
                needs_followup.append(lead)
        
        print(json.dumps(needs_followup, default=str))
