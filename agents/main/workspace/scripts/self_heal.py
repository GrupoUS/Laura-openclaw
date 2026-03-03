#!/usr/bin/env python3
"""
self_heal.py — Sistema de auto-aprimoramento dos agentes do Grupo US.

Analisa erros recentes no agent_bus, extrai lições, armazena permanentemente
e (opcionalmente) atualiza arquivos de regras como SOUL.md e AGENTS.md.

Uso:
  python3 self_heal.py review         # Analisa erros das últimas 24h e gera lições
  python3 self_heal.py lessons        # Lista lições aprendidas
  python3 self_heal.py log-error      # Registra erro com contexto para análise futura
  python3 self_heal.py log-lesson     # Registra lição manualmente
  python3 self_heal.py apply-lessons  # Mostra lições que devem ser aplicadas agora
"""

import json, sys, argparse, os, re
from datetime import datetime, timezone

NEON_URL = os.environ.get(
    'NEON_DATABASE_URL',
    'postgresql://neondb_owner:npg_P0ljy3pWNTYc@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb'
)

WORKSPACE = os.path.expanduser('~/.openclaw/agents/main/workspace')
SOUL_FILE = os.path.join(WORKSPACE, 'SOUL.md')
AGENTS_FILE = os.path.join(WORKSPACE, 'AGENTS.md')
MEMORY_DIR = os.path.join(WORKSPACE, 'memory')


def get_conn():
    import psycopg2
    return psycopg2.connect(NEON_URL)


def log_error(agent_id: str, error_type: str, description: str,
              context: dict = None, suggested_fix: str = None):
    """Registra um erro com contexto completo para análise futura."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO agent_events (agent_id, event_type, content, metadata)
                   VALUES (%s, 'error', %s, %s) RETURNING id""",
                (agent_id, description, json.dumps({
                    'error_type': error_type,
                    'context': context or {},
                    'suggested_fix': suggested_fix
                }))
            )
            row_id = cur.fetchone()[0]
        conn.commit()
    return row_id


def save_lesson(key: str, category: str, description: str,
                root_cause: str = None, fix_applied: str = None,
                severity: str = 'medium', agent_id: str = 'system',
                auto_applied: bool = False, file_updated: str = None):
    """Salva ou atualiza uma lição aprendida permanentemente."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO agent_lessons
                   (lesson_key, category, description, root_cause, fix_applied,
                    severity, times_triggered, source_agent, auto_applied, file_updated)
                   VALUES (%s, %s, %s, %s, %s, %s, 1, %s, %s, %s)
                   ON CONFLICT (lesson_key) DO UPDATE SET
                     times_triggered = agent_lessons.times_triggered + 1,
                     last_triggered_at = NOW(),
                     description = EXCLUDED.description,
                     root_cause = COALESCE(EXCLUDED.root_cause, agent_lessons.root_cause),
                     fix_applied = COALESCE(EXCLUDED.fix_applied, agent_lessons.fix_applied),
                     severity = EXCLUDED.severity,
                     auto_applied = EXCLUDED.auto_applied,
                     file_updated = COALESCE(EXCLUDED.file_updated, agent_lessons.file_updated)
                   RETURNING id, times_triggered""",
                (key, category, description, root_cause, fix_applied,
                 severity, agent_id, auto_applied, file_updated)
            )
            row = cur.fetchone()
        conn.commit()
    return {'id': row[0], 'times_triggered': row[1]}


def get_lessons(category: str = None, severity: str = None, limit: int = 50):
    """Lista lições aprendidas com filtros opcionais."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            conditions = []
            params = []
            if category:
                conditions.append("category = %s")
                params.append(category)
            if severity:
                conditions.append("severity = %s")
                params.append(severity)
            where = "WHERE " + " AND ".join(conditions) if conditions else ""
            params.append(limit)
            cur.execute(
                f"""SELECT lesson_key, category, description, root_cause, fix_applied,
                          severity, times_triggered, last_triggered_at, auto_applied, file_updated
                   FROM agent_lessons {where}
                   ORDER BY severity DESC, times_triggered DESC, last_triggered_at DESC
                   LIMIT %s""",
                params
            )
            rows = cur.fetchall()

    lessons = []
    for r in rows:
        lessons.append({
            'key': r[0], 'category': r[1], 'description': r[2],
            'root_cause': r[3], 'fix_applied': r[4], 'severity': r[5],
            'times_triggered': r[6],
            'last_triggered': r[7].isoformat() if r[7] else None,
            'auto_applied': r[8], 'file_updated': r[9]
        })
    return lessons


def review_and_learn(hours: float = 24, dry_run: bool = False):
    """
    Analisa eventos de erro das últimas N horas,
    agrupa padrões e gera/atualiza lições.
    """
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT agent_id, event_type, content, metadata, created_at
                   FROM agent_events
                   WHERE created_at > NOW() - INTERVAL '%s hours'
                     AND event_type IN ('error', 'warning', 'duplicate_sent', 'wrong_recipient',
                                        'no_response', 'system_leak', 'cron_failed')
                   ORDER BY created_at DESC""",
                (hours,)
            )
            errors = cur.fetchall()

    if not errors:
        return {'errors_found': 0, 'lessons_created': 0, 'summary': 'Nenhum erro encontrado.'}

    # Group by error patterns
    patterns = {}
    for agent_id, etype, content, meta, created_at in errors:
        key = f"{agent_id}:{etype}"
        if key not in patterns:
            patterns[key] = {'agent': agent_id, 'type': etype, 'count': 0, 'examples': []}
        patterns[key]['count'] += 1
        patterns[key]['examples'].append(content[:200])

    lessons_created = 0
    lessons_updated = 0
    results = []

    for pattern_key, data in patterns.items():
        lesson_key = f"auto:{pattern_key}"
        desc = f"[{data['agent']}] {data['type']} ocorreu {data['count']}x nas últimas {hours}h. Ex: {data['examples'][0][:120]}"

        # Determine severity based on error type and frequency
        if data['type'] in ('wrong_recipient', 'system_leak') or data['count'] >= 5:
            severity = 'critical'
        elif data['type'] in ('duplicate_sent', 'no_response') or data['count'] >= 3:
            severity = 'high'
        else:
            severity = 'medium'

        result = save_lesson(
            key=lesson_key,
            category=data['type'],
            description=desc,
            severity=severity,
            agent_id=data['agent']
        )
        if result['times_triggered'] == 1:
            lessons_created += 1
        else:
            lessons_updated += 1
        results.append({'key': lesson_key, 'severity': severity, 'count': data['count']})

    # Log the self-heal run
    summary = f"Revisão {hours}h: {len(errors)} erros, {lessons_created} lições novas, {lessons_updated} atualizadas"
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO self_heal_log (errors_found, lessons_created, lessons_updated, summary)
                   VALUES (%s, %s, %s, %s)""",
                (len(errors), lessons_created, lessons_updated, summary)
            )
        conn.commit()

    return {
        'errors_found': len(errors),
        'lessons_created': lessons_created,
        'lessons_updated': lessons_updated,
        'patterns': results,
        'summary': summary
    }


def apply_lessons_to_context():
    """
    Retorna as lições mais relevantes para incluir no contexto do agente.
    Chamado no início de cada sessão para 'injetar' aprendizados.
    """
    lessons = get_lessons(limit=20)
    if not lessons:
        return "✅ Nenhuma lição crítica a aplicar."

    output = ["🎓 LIÇÕES APRENDIDAS (aplicar sempre):\n"]
    for l in lessons:
        emoji = "🔴" if l['severity'] == 'critical' else "🟡" if l['severity'] == 'high' else "🟢"
        output.append(f"{emoji} [{l['category']}] {l['description'][:120]}")
        if l['fix_applied']:
            output.append(f"   → Fix: {l['fix_applied'][:100]}")
        output.append(f"   → Ocorreu {l['times_triggered']}x | Última vez: {l['last_triggered'][:10] if l['last_triggered'] else '?'}")
        output.append("")

    return "\n".join(output)


def seed_known_lessons():
    """Semeia as lições já conhecidas dos erros documentados no MEMORY.md."""
    known_lessons = [
        {
            'key': 'wrong_recipient:tania_erika_confusion',
            'category': 'wrong_recipient',
            'description': 'Tânia (+556299438005) chamada de Érica ou "chefe". São pessoas diferentes!',
            'root_cause': 'Número +556299438005 estava salvo incorretamente como Érica',
            'fix_applied': 'SOUL.md atualizado com mapa de contatos correto. Érica = +556199574354',
            'severity': 'critical',
            'agent_id': 'laura',
            'auto_applied': True,
            'file_updated': 'SOUL.md'
        },
        {
            'key': 'system_leak:heartbeat_to_lead',
            'category': 'system_leak',
            'description': 'Relatório de heartbeat/sistema enviado para lead ou funcionário. NUNCA fazer isso.',
            'root_cause': 'Sessão principal confundida com sessão de lead durante heartbeat',
            'fix_applied': 'REGRA 18 em SOUL.md: mensagens de sistema SOMENTE para Maurício (+556299776996)',
            'severity': 'critical',
            'agent_id': 'laura',
            'auto_applied': True,
            'file_updated': 'SOUL.md'
        },
        {
            'key': 'tts:wrong_voice',
            'category': 'wrong_voice',
            'description': 'Áudio enviado com voz diferente de Raquel (ElevenLabs ID: GDzHdQOi6jjf8zaXhCYD)',
            'root_cause': 'Agente usou voz padrão ao invés de Raquel',
            'fix_applied': 'SOUL.md REGRA 1: voz exclusiva é Raquel. Sempre converter para OGG Opus.',
            'severity': 'high',
            'agent_id': 'laura',
            'auto_applied': True,
            'file_updated': 'SOUL.md'
        },
        {
            'key': 'sdr:no_followup_stalled_leads',
            'category': 'no_response',
            'description': 'Leads que receberam abertura SDR mas pararam de responder nunca eram reativados.',
            'root_cause': 'check_leads_pending.py só detectava leads onde ÚLTIMA mensagem era do usuário',
            'fix_applied': 'Criado check_stalled_leads.py + cron sdr-followup-travados (2h)',
            'severity': 'high',
            'agent_id': 'laura',
            'auto_applied': True,
            'file_updated': 'scripts/check_stalled_leads.py'
        },
        {
            'key': 'sdr:weekend_followup',
            'category': 'wrong_timing',
            'description': 'Follow-up proativo de leads em fim de semana (proibido). Novos leads = ok, follow-up = não.',
            'root_cause': 'Cron não verificava o dia da semana',
            'fix_applied': 'SOUL.md REGRA 11: FDS novos leads sim, follow-up proativo não.',
            'severity': 'medium',
            'agent_id': 'laura',
            'auto_applied': True,
            'file_updated': 'SOUL.md'
        },
        {
            'key': 'sdr:price_disclosed',
            'category': 'policy_violation',
            'description': 'SDR informou preço, parcelamento ou condições para lead. NUNCA fazer isso.',
            'root_cause': 'Sem clareza de que fechar venda é papel do closer (Lucas/Érica)',
            'fix_applied': 'SOUL.md REGRA 7: SDR qualifica e passa. Preços = papel do closer.',
            'severity': 'critical',
            'agent_id': 'laura',
            'auto_applied': True,
            'file_updated': 'SOUL.md'
        },
        {
            'key': 'spawn:for_direct_lead',
            'category': 'wrong_routing',
            'description': 'Sub-agente spawned para atender lead direto no WhatsApp. NUNCA fazer isso.',
            'root_cause': 'Confusão entre tarefas internas (spawn ok) e leads diretos (Laura responde)',
            'fix_applied': 'SOUL.md REGRA 16: Lead no WhatsApp → EU respondo. Nunca sessions_spawn.',
            'severity': 'critical',
            'agent_id': 'laura',
            'auto_applied': True,
            'file_updated': 'SOUL.md'
        },
    ]

    count = 0
    for l in known_lessons:
        result = save_lesson(**l)
        count += 1
        status = "nova" if result['times_triggered'] == 1 else f"já existia ({result['times_triggered']}x)"
        print(f"  [{l['severity']}] {l['key']} — {status}")

    return count


def main():
    parser = argparse.ArgumentParser(description='Self-Heal — Auto-aprimoramento dos agentes')
    sub = parser.add_subparsers(dest='cmd')

    p_rev = sub.add_parser('review', help='Analisa erros recentes e gera lições')
    p_rev.add_argument('--hours', type=float, default=24)
    p_rev.add_argument('--dry-run', action='store_true')

    p_les = sub.add_parser('lessons', help='Lista lições aprendidas')
    p_les.add_argument('--category', default=None)
    p_les.add_argument('--severity', default=None)
    p_les.add_argument('--json', action='store_true')

    p_err = sub.add_parser('log-error', help='Registra erro para análise futura')
    p_err.add_argument('--agent', required=True)
    p_err.add_argument('--type', required=True)
    p_err.add_argument('--content', required=True)
    p_err.add_argument('--fix', default=None)
    p_err.add_argument('--meta', default='{}')

    p_les2 = sub.add_parser('log-lesson', help='Registra lição manualmente')
    p_les2.add_argument('--key', required=True)
    p_les2.add_argument('--category', required=True)
    p_les2.add_argument('--description', required=True)
    p_les2.add_argument('--root-cause', default=None)
    p_les2.add_argument('--fix', default=None)
    p_les2.add_argument('--severity', default='medium')
    p_les2.add_argument('--agent', default='system')

    sub.add_parser('apply-lessons', help='Mostra lições a aplicar agora')
    sub.add_parser('seed', help='Semeia lições conhecidas dos erros históricos')

    args = parser.parse_args()

    if args.cmd == 'review':
        result = review_and_learn(hours=getattr(args, 'hours', 24), dry_run=getattr(args, 'dry_run', False))
        print(f"\n🔍 {result['summary']}")
        for p in result.get('patterns', []):
            emoji = "🔴" if p['severity'] == 'critical' else "🟡" if p['severity'] == 'high' else "🟢"
            print(f"  {emoji} {p['key']} — {p['count']}x ({p['severity']})")

    elif args.cmd == 'lessons':
        lessons = get_lessons(
            category=getattr(args, 'category', None),
            severity=getattr(args, 'severity', None)
        )
        if getattr(args, 'json', False):
            print(json.dumps(lessons, ensure_ascii=False, default=str))
        else:
            print(f"🎓 {len(lessons)} lição(ões) aprendida(s):\n")
            for l in lessons:
                emoji = "🔴" if l['severity'] == 'critical' else "🟡" if l['severity'] == 'high' else "🟢"
                print(f"  {emoji} [{l['category']}] {l['key']}")
                print(f"     {l['description'][:100]}")
                if l['fix_applied']:
                    print(f"     Fix: {l['fix_applied'][:80]}")
                print(f"     Ocorreu {l['times_triggered']}x")
                print()

    elif args.cmd == 'log-error':
        row_id = log_error(args.agent, args.type, args.content,
                           json.loads(args.meta), getattr(args, 'fix', None))
        print(f"✅ Erro #{row_id} registrado para análise futura")

    elif args.cmd == 'log-lesson':
        result = save_lesson(
            key=args.key, category=args.category,
            description=args.description,
            root_cause=getattr(args, 'root_cause', None),
            fix_applied=getattr(args, 'fix', None),
            severity=args.severity, agent_id=args.agent
        )
        print(f"✅ Lição salva (ID: {result['id']}, {result['times_triggered']}x)")

    elif args.cmd == 'apply-lessons':
        print(apply_lessons_to_context())

    elif args.cmd == 'seed':
        print("Semeando lições conhecidas...")
        count = seed_known_lessons()
        print(f"\n✅ {count} lições semeadas.")

    else:
        parser.print_help()


if __name__ == '__main__':
    main()
