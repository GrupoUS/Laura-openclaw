#!/usr/bin/env python3
"""
SDR Automation CLI API Client for OpenClaw
Replaces legacy Node.js sdr-leads-watch.js, sales-followup.js, etc.

Usage:
  ./sdr_automation_cli.py leads check [--sheet-id ID] [--tab TAB]
  ./sdr_automation_cli.py leads mark [--sheet-id ID] [--tab TAB] [--value "Status"]
  ./sdr_automation_cli.py followup add <name> <phone> <closer>
  ./sdr_automation_cli.py followup update <phone> <status>
  ./sdr_automation_cli.py followup check-daily
"""

import sys
import json
import os
import time
import requests
from datetime import datetime, timedelta

# Files
LOG_PATH = os.path.expanduser('~/.openclaw/data/sdr-leads-log.json')
DB_PATH = os.path.expanduser('~/.openclaw/memory/sales-followups.json')
CONTACTS_FILE = os.path.expanduser('~/.openclaw/memory/sales_team.json')

# Holidays for Brazil
HOLIDAYS_2026 = [
    '2026-01-01', '2026-02-16', '2026-02-17', '2026-04-03', '2026-04-21',
    '2026-05-01', '2026-06-04', '2026-09-07', '2026-10-12', '2026-11-02',
    '2026-11-20', '2026-12-25'
]

CADENCE = [1, 1, 2, 1, 2] # Days to add for next step (Business Days)

# --- Followup Logic ---

def load_db():
    if os.path.exists(DB_PATH):
        try:
            with open(DB_PATH, 'r') as f:
                return json.load(f)
        except Exception:
            pass
    return []

def save_db(data):
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with open(DB_PATH, 'w') as f:
        json.dump(data, f, indent=2)

def is_business_day(date_obj):
    if date_obj.weekday() in [5, 6]: # 5=Sat, 6=Sun
        return False
    iso = date_obj.strftime('%Y-%m-%d')
    if iso in HOLIDAYS_2026:
        return False
    return True

def add_business_days(date_obj, days):
    result = date_obj
    added = 0
    while added < days:
        result += timedelta(days=1)
        if is_business_day(result):
            added += 1
    return result

def get_next_date(last_date_str, step_index):
    try:
        last_date = datetime.strptime(last_date_str, '%Y-%m-%d')
    except Exception:
        return None

    if step_index >= len(CADENCE):
        return None # End of flow

    days_to_add = CADENCE[step_index]
    return add_business_days(last_date, days_to_add)

def cmd_followup_add(name, phone, closer):
    db = load_db()
    for l in db:
        if l.get('phone') == phone and l.get('status') == 'Active':
            print("Lead already active.")
            return

    db.append({
        'name': name,
        'phone': phone,
        'closer': closer,
        'status': 'Active',
        'step': 0,
        'lastInteractionDate': datetime.now().strftime('%Y-%m-%d')
    })
    save_db(db)
    print(f"Lead {name} added to follow-up flow.")

def cmd_followup_update(phone, status):
    db = load_db()
    phone_digits = "".join(filter(str.isdigit, phone))
    if len(phone_digits) > 8:
        phone_suffix = phone_digits[-8:]
    else:
        phone_suffix = phone_digits

    updated = False
    for l in db:
        l_phone_digits = "".join(filter(str.isdigit, l.get('phone', '')))
        if phone_suffix in l_phone_digits and l.get('status') not in ['Won', 'Lost']:
            l['status'] = status
            updated = True
            print(f"Updated {l.get('name')} to {status}")
            break

    if updated:
        save_db(db)
    else:
        print("Lead not found or already closed.")

def cmd_followup_check():
    db = load_db()
    today_str = datetime.now().strftime('%Y-%m-%d')
    today_date = datetime.now()

    report = {
        'lucas': {1: [], 2: [], 3: [], 4: [], 5: [], 'lostYesterday': [], 'negotiating': []},
        'erica': {1: [], 2: [], 3: [], 4: [], 5: [], 'lostYesterday': [], 'negotiating': []}
    }

    has_updates = False

    for l in db:
        status = l.get('status')
        if status in ['Won', 'Lost']:
            continue

        closer = l.get('closer', 'lucas')
        if closer not in report:
            report[closer] = {1: [], 2: [], 3: [], 4: [], 5: [], 'lostYesterday': [], 'negotiating': []}

        if status == 'Negotiating':
            report[closer]['negotiating'].append(l)
            continue

        last_date_str = l.get('lastInteractionDate')
        step = l.get('step', 0)

        next_date = get_next_date(last_date_str, step)

        if next_date and today_date >= next_date:
            next_step = step + 1
            if next_step <= 5:
                report[closer][next_step].append(l)
                l['step'] = next_step
                l['lastInteractionDate'] = today_str
                has_updates = True
        elif not next_date and step == 5:
            l['status'] = 'Lost'
            report[closer]['lostYesterday'].append(l)
            has_updates = True

    if has_updates:
        save_db(db)

    # Build Messages
    team = []
    if os.path.exists(CONTACTS_FILE):
        try:
            with open(CONTACTS_FILE, 'r') as f:
                team = json.load(f).get('team', [])
        except Exception:
            pass

    # Mock fallback if file doesn't exist
    if not team:
        team = [{'id': 'lucas', 'phone': ''}, {'id': 'erica', 'phone': ''}]

    date_formatted = datetime.now().strftime('%d/%m/%Y')

    for closer_obj in team:
        closer_id = closer_obj.get('id')
        r = report.get(closer_id)
        if not r:
            continue

        msg = f"🔔 *Follow-ups do Dia!* ({date_formatted})\n\n"
        has_content = False

        for i in range(1, 6):
            if r[i]:
                msg += f"*Lista de follow up {i}*\n"
                for l in r[i]:
                    msg += f"- {l.get('name')} ({l.get('phone')})\n"
                msg += "\n"
                has_content = True

        if r['lostYesterday']:
            msg += "*Lista de quem terminou o último follow ontem e foi dado como perdido*\n"
            for l in r['lostYesterday']:
                msg += f"- {l.get('name')} ({l.get('phone')})\n"
            msg += "\n"
            has_content = True

        if r['negotiating']:
            msg += "*Lista de leads em negociação (Acompanhar)*\n"
            for l in r['negotiating']:
                msg += f"- {l.get('name')} ({l.get('phone')})\n"
            msg += "\n"
            has_content = True

        if has_content:
            # We output JSON here for another agent/tool to parse
            print(json.dumps({"action": "SEND_MESSAGE", "closer": closer_id, "phone": closer_obj.get('phone'), "msg": msg}))
        else:
            print(json.dumps({"action": "NO_MESSAGES", "closer": closer_id}))

# --- Leads Watch Logic ---
# (Stubs for demonstration/migration path. Given how specific the Google Sheets logic is,
#  a robust Python implementation would use google-api-python-client. For now, we mock the interface
#  and alert the user to use `gog sheets` or provide the logic.)

def cmd_leads_check(sheet_id, tab):
    # This uses the `gog` CLI under the hood or alerts for missing google libs
    print(f"Checking leads for sheet_id={sheet_id}, tab={tab}")
    print("Para manipular o Google Sheets robustamente em Python, instale 'google-api-python-client'")
    print("Ou utilize o comando 'gog sheets' do OpenClaw.")

def cmd_leads_mark(sheet_id, tab, value):
    print(f"Marking leads for sheet_id={sheet_id}, tab={tab} with value={value}")
    print("Para manipular o Google Sheets robustamente em Python, instale 'google-api-python-client'")
    print("Ou utilize o comando 'gog sheets' do OpenClaw.")

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd_group = sys.argv[1]

    if cmd_group == 'followup':
        if len(sys.argv) < 3:
            print("Missing followup command")
            sys.exit(1)

        subcmd = sys.argv[2]
        if subcmd == 'add':
            if len(sys.argv) < 6:
                print("Missing args. sdr_automation_cli.py followup add <name> <phone> <closer>")
                sys.exit(1)
            cmd_followup_add(sys.argv[3], sys.argv[4], sys.argv[5])
        elif subcmd == 'update':
            if len(sys.argv) < 5:
                print("Missing args. sdr_automation_cli.py followup update <phone> <status>")
                sys.exit(1)
            cmd_followup_update(sys.argv[3], sys.argv[4])
        elif subcmd == 'check-daily':
            cmd_followup_check()
        else:
            print(f"Unknown followup command: {subcmd}")

    elif cmd_group == 'leads':
        if len(sys.argv) < 3:
            print("Missing leads command")
            sys.exit(1)

        # Simple arg parsing
        subcmd = sys.argv[2]
        sheet_id = None
        tab = None
        value = "Contato iniciado (Laura)"

        for i in range(3, len(sys.argv)):
            if sys.argv[i] == '--sheet-id' and i+1 < len(sys.argv):
                sheet_id = sys.argv[i+1]
            if sys.argv[i] == '--tab' and i+1 < len(sys.argv):
                tab = sys.argv[i+1]
            if sys.argv[i] == '--value' and i+1 < len(sys.argv):
                value = sys.argv[i+1]

        if subcmd == 'check':
            cmd_leads_check(sheet_id, tab)
        elif subcmd == 'mark':
            cmd_leads_mark(sheet_id, tab, value)
        else:
            print(f"Unknown leads command: {subcmd}")

    else:
        print(f"Unknown command group: {cmd_group}")

if __name__ == '__main__':
    main()
