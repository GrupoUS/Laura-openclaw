#!/usr/bin/env python3
"""
agent_bus.py — Barramento de memória compartilhada entre todos os agentes do Grupo US.

Todo agente deve usar este script para:
  1. Registrar ações relevantes (log_event)
  2. Buscar contexto recente de todos os agentes (get_context)
  3. Guardar/buscar memória compartilhada (set_memory / get_memory)
  4. Atualizar contexto de lead (update_lead / get_lead)

Uso:
  python3 agent_bus.py log --agent laura --type message_sent --content "Respondeu lead +5562..." --meta '{"phone":"+5562..."}'
  python3 agent_bus.py context --hours 6
  python3 agent_bus.py set-memory --key "lead:+5562..." --value '{"stage":"qualificado"}' --agent laura
  python3 agent_bus.py get-memory --key "lead:+5562..."
  python3 agent_bus.py update-lead --phone "+5562..." --agent laura --stage qualificado --action "Perguntou sobre TRINTAE3"
  python3 agent_bus.py get-lead --phone "+5562..."
"""

import json, sys, argparse, os
from datetime import datetime, timezone

NEON_URL = os.environ.get(
    'NEON_DATABASE_URL',
    'postgresql://neondb_owner:npg_P0ljy3pWNTYc@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb'
)


def get_conn():
    import psycopg2
    return psycopg2.connect(NEON_URL)


def log_event(agent_id: str, event_type: str, content: str, metadata: dict = None):
    """Registra uma ação/evento de um agente no barramento compartilhado."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO agent_events (agent_id, event_type, content, metadata) VALUES (%s, %s, %s, %s) RETURNING id",
                (agent_id, event_type, content, json.dumps(metadata or {}))
            )
            row_id = cur.fetchone()[0]
        conn.commit()
    return row_id


def get_context(hours: float = 6, limit: int = 50, agent_filter: str = None):
    """Retorna eventos recentes de todos os agentes (ou de um agente específico)."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            if agent_filter:
                cur.execute(
                    """SELECT agent_id, event_type, content, metadata, created_at
                       FROM agent_events
                       WHERE created_at > NOW() - INTERVAL '%s hours'
                         AND agent_id = %s
                       ORDER BY created_at DESC LIMIT %s""",
                    (hours, agent_filter, limit)
                )
            else:
                cur.execute(
                    """SELECT agent_id, event_type, content, metadata, created_at
                       FROM agent_events
                       WHERE created_at > NOW() - INTERVAL '%s hours'
                       ORDER BY created_at DESC LIMIT %s""",
                    (hours, limit)
                )
            rows = cur.fetchall()

    events = []
    for r in rows:
        events.append({
            'agent_id': r[0],
            'event_type': r[1],
            'content': r[2],
            'metadata': r[3],
            'created_at': r[4].isoformat() if r[4] else None
        })
    return events


def set_memory(key: str, value: dict, agent_id: str):
    """Grava ou atualiza uma chave na memória compartilhada."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO agent_shared_memory (memory_key, value, updated_by)
                   VALUES (%s, %s, %s)
                   ON CONFLICT (memory_key) DO UPDATE
                   SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()""",
                (key, json.dumps(value), agent_id)
            )
        conn.commit()


def get_memory(key: str):
    """Busca uma chave da memória compartilhada."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT value, updated_by, updated_at FROM agent_shared_memory WHERE memory_key = %s",
                (key,)
            )
            row = cur.fetchone()
    if not row:
        return None
    return {'value': row[0], 'updated_by': row[1], 'updated_at': row[2].isoformat() if row[2] else None}


def update_lead(phone: str, agent_id: str, name: str = None, product: str = None,
                stage: str = None, closer: str = None, action: str = None, note: str = None):
    """Atualiza o contexto de um lead — todos os agentes veem o mesmo registro."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            # Get existing notes
            cur.execute("SELECT notes FROM lead_context WHERE phone = %s", (phone,))
            row = cur.fetchone()
            existing_notes = row[0] if row else []
            if not isinstance(existing_notes, list):
                existing_notes = []

            if note:
                existing_notes.append({
                    'ts': datetime.now(timezone.utc).isoformat(),
                    'agent': agent_id,
                    'note': note
                })

            cur.execute(
                """INSERT INTO lead_context (phone, name, product_interest, stage, closer, last_agent, last_action, notes)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (phone) DO UPDATE SET
                     name = COALESCE(EXCLUDED.name, lead_context.name),
                     product_interest = COALESCE(EXCLUDED.product_interest, lead_context.product_interest),
                     stage = COALESCE(EXCLUDED.stage, lead_context.stage),
                     closer = COALESCE(EXCLUDED.closer, lead_context.closer),
                     last_agent = EXCLUDED.last_agent,
                     last_action = COALESCE(EXCLUDED.last_action, lead_context.last_action),
                     notes = EXCLUDED.notes,
                     updated_at = NOW()""",
                (phone, name, product, stage, closer, agent_id, action, json.dumps(existing_notes))
            )
        conn.commit()

    # Also log the event
    log_event(agent_id, 'lead_update', f"Lead {phone}: {action or stage or 'atualizado'}", {
        'phone': phone, 'stage': stage, 'action': action
    })


def get_lead(phone: str):
    """Busca o contexto completo de um lead."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT phone, name, product_interest, stage, closer, last_agent,
                          last_action, notes, created_at, updated_at
                   FROM lead_context WHERE phone = %s""",
                (phone,)
            )
            row = cur.fetchone()
    if not row:
        return None
    return {
        'phone': row[0], 'name': row[1], 'product_interest': row[2],
        'stage': row[3], 'closer': row[4], 'last_agent': row[5],
        'last_action': row[6], 'notes': row[7],
        'created_at': row[8].isoformat() if row[8] else None,
        'updated_at': row[9].isoformat() if row[9] else None
    }


def main():
    parser = argparse.ArgumentParser(description='Agent Bus — Memória Compartilhada Grupo US')
    sub = parser.add_subparsers(dest='cmd')

    # log
    p_log = sub.add_parser('log', help='Registra evento de agente')
    p_log.add_argument('--agent', required=True)
    p_log.add_argument('--type', required=True)
    p_log.add_argument('--content', required=True)
    p_log.add_argument('--meta', default='{}')

    # context
    p_ctx = sub.add_parser('context', help='Busca eventos recentes de todos os agentes')
    p_ctx.add_argument('--hours', type=float, default=6)
    p_ctx.add_argument('--agent', default=None)
    p_ctx.add_argument('--limit', type=int, default=20)
    p_ctx.add_argument('--json', action='store_true')

    # set-memory
    p_set = sub.add_parser('set-memory', help='Grava chave na memória compartilhada')
    p_set.add_argument('--key', required=True)
    p_set.add_argument('--value', required=True)
    p_set.add_argument('--agent', required=True)

    # get-memory
    p_get = sub.add_parser('get-memory', help='Busca chave da memória compartilhada')
    p_get.add_argument('--key', required=True)

    # update-lead
    p_ul = sub.add_parser('update-lead', help='Atualiza contexto de lead')
    p_ul.add_argument('--phone', required=True)
    p_ul.add_argument('--agent', required=True)
    p_ul.add_argument('--name', default=None)
    p_ul.add_argument('--product', default=None)
    p_ul.add_argument('--stage', default=None)
    p_ul.add_argument('--closer', default=None)
    p_ul.add_argument('--action', default=None)
    p_ul.add_argument('--note', default=None)

    # get-lead
    p_gl = sub.add_parser('get-lead', help='Busca contexto completo de lead')
    p_gl.add_argument('--phone', required=True)

    args = parser.parse_args()

    if args.cmd == 'log':
        row_id = log_event(args.agent, args.type, args.content, json.loads(args.meta))
        print(f"✅ Evento #{row_id} registrado")

    elif args.cmd == 'context':
        events = get_context(hours=args.hours, limit=args.limit, agent_filter=args.agent)
        if getattr(args, 'json', False):
            print(json.dumps(events, ensure_ascii=False, default=str))
        else:
            print(f"📡 {len(events)} eventos nas últimas {args.hours}h:\n")
            for e in events:
                ts = e['created_at'][:16] if e['created_at'] else '?'
                print(f"  [{e['agent_id']}] {ts} | {e['event_type']}: {e['content'][:80]}")

    elif args.cmd == 'set-memory':
        set_memory(args.key, json.loads(args.value), args.agent)
        print(f"✅ Memória '{args.key}' salva por {args.agent}")

    elif args.cmd == 'get-memory':
        result = get_memory(args.key)
        if result:
            print(json.dumps(result, ensure_ascii=False, default=str))
        else:
            print("null")

    elif args.cmd == 'update-lead':
        update_lead(args.phone, args.agent, args.name, args.product,
                    args.stage, args.closer, args.action, args.note)
        print(f"✅ Lead {args.phone} atualizado por {args.agent}")

    elif args.cmd == 'get-lead':
        result = get_lead(args.phone)
        if result:
            print(json.dumps(result, ensure_ascii=False, default=str))
        else:
            print(f"Lead {args.phone} não encontrado")

    else:
        parser.print_help()


if __name__ == '__main__':
    main()
