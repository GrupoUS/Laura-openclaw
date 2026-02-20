#!/usr/bin/env python3
"""
Zoom CLI API Client for OpenClaw
Replaces legacy Node.js zoom.js and zoom-summary-watch.js scripts.

Usage:
  ./zoom_cli.py list-meetings [type]
  ./zoom_cli.py create-meeting "Topic" "YYYY-MM-DDTHH:MM:SS" [duration_mins]
  ./zoom_cli.py get-meeting <meeting_id>
  ./zoom_cli.py get-summary <meeting_id>
  ./zoom_cli.py watch-summaries [--out file.json]
"""

import sys
import json
import os
import time
import base64
import hashlib
import requests
from urllib.parse import urlencode, quote

CONFIG_PATH = os.path.expanduser('~/.openclaw/config/zoom.json')
LOG_PATH = os.path.expanduser('~/.openclaw/data/zoom-summary-log.json')
TOKEN_PATH = os.path.expanduser('~/.openclaw/config/zoom-token.json')

class ZoomClient:
    def __init__(self):
        try:
            with open(CONFIG_PATH, 'r') as f:
                self.config = json.load(f)
        except Exception as e:
            print(f"Erro ao carregar config {CONFIG_PATH}: {e}")
            sys.exit(1)

        self.client_id = self.config.get('clientId')
        self.client_secret = self.config.get('clientSecret')
        self.account_id = self.config.get('accountId')
        self.token = None
        self.token_expiry = 0

    def get_token(self):
        if self.token and time.time() < self.token_expiry:
            return self.token

        try:
            if os.path.exists(TOKEN_PATH):
                with open(TOKEN_PATH, 'r') as f:
                    cached = json.load(f)
                if time.time() < cached.get('expiry', 0):
                    self.token = cached.get('token')
                    self.token_expiry = cached.get('expiry')
                    return self.token
        except Exception:
            pass

        auth_str = f"{self.client_id}:{self.client_secret}"
        auth_bytes = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')

        headers = {
            'Authorization': f'Basic {auth_bytes}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        params = {
            'grant_type': 'account_credentials',
            'account_id': self.account_id
        }

        url = f"https://zoom.us/oauth/token?{urlencode(params)}"
        try:
            resp = requests.post(url, headers=headers)
            resp.raise_for_status()
            result = resp.json()

            self.token = result.get('access_token')
            expires_in = result.get('expires_in', 3600)
            self.token_expiry = time.time() + expires_in - 60

            with open(TOKEN_PATH, 'w') as f:
                json.dump({'token': self.token, 'expiry': self.token_expiry}, f)

            return self.token
        except Exception as e:
            print(f"Erro ao obter token Zoom: {e}")
            if hasattr(resp, 'text'):
                print(resp.text)
            sys.exit(1)

    def request(self, method, endpoint, body=None):
        token = self.get_token()
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        url = f"https://api.zoom.us/v2{endpoint}"

        kw = {'headers': headers}
        if body is not None:
            kw['json'] = body

        try:
            resp = requests.request(method, url, **kw)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            raise Exception(f"API Error: {e} | {getattr(resp, 'text', '')}")

    def list_meetings(self, meeting_type='scheduled', next_page_token=None):
        if meeting_type and len(meeting_type) > 20 and meeting_type not in ['scheduled', 'live', 'upcoming', 'previous']:
            next_page_token = meeting_type
            meeting_type = 'scheduled'

        params = {'type': meeting_type}
        if next_page_token:
            params['next_page_token'] = next_page_token

        endpoint = f"/users/me/meetings?{urlencode(params)}"
        return self.request('GET', endpoint)

    def create_meeting(self, topic, start_time, duration=60):
        body = {
            'topic': topic,
            'type': 2,
            'start_time': start_time,
            'duration': int(duration),
            'timezone': 'America/Sao_Paulo',
            'settings': {
                'host_video': True,
                'participant_video': True,
                'join_before_host': False,
                'mute_upon_entry': True,
                'waiting_room': True
            }
        }
        return self.request('POST', '/users/me/meetings', body)

    def get_summary(self, meeting_id):
        encoded_id = quote(str(meeting_id), safe='')
        return self.request('GET', f"/meetings/{encoded_id}/meeting_summary")

    def get_meeting(self, meeting_id):
        encoded_id = quote(str(meeting_id), safe='')
        return self.request('GET', f"/meetings/{encoded_id}")


def extract_summary_fields(summary):
    summary_text = summary.get('summary') or summary.get('meeting_summary') or summary.get('summary_text') or summary.get('text') or ''
    action_items = summary.get('action_items') or summary.get('actionItems') or summary.get('next_steps') or summary.get('nextSteps') or []
    topics = summary.get('topics') or summary.get('key_points') or summary.get('highlights') or []
    return summary_text, action_items, topics

def watch_summaries(client, out_path='/tmp/zoom_summaries.json'):
    log = {}
    if os.path.exists(LOG_PATH):
        try:
            with open(LOG_PATH, 'r') as f:
                log = json.load(f)
        except Exception:
            pass

    results = []
    meetings_data = client.list_meetings()

    for m in meetings_data.get('meetings', []):
        m_id = str(m.get('id', ''))
        if not m_id:
            continue

        try:
            summary = client.get_summary(m_id)
            summary_str = json.dumps(summary, sort_keys=True)
            h = hashlib.sha1(summary_str.encode('utf-8')).hexdigest()

            if log.get(m_id) == h:
                continue

            summary_text, action_items, topics = extract_summary_fields(summary)
            results.append({
                'meetingId': m_id,
                'topic': m.get('topic'),
                'start_time': m.get('start_time'),
                'summaryText': summary_text,
                'actionItems': action_items,
                'topics': topics,
                'raw': summary
            })
            log[m_id] = h
        except Exception as e:
            # Silence not enabled or missing summaries
            continue

    if results:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, 'w') as f:
            json.dump(log, f, indent=2)

    with open(out_path, 'w') as f:
        json.dump({'count': len(results), 'summaries': results}, f, indent=2)

    print(json.dumps({'count': len(results), 'out': out_path}, indent=2))

def main():
    if len(sys.argv) < 2:
        print("Uso: ./zoom_cli.py <command> [args]")
        print("Commands:")
        print("  list-meetings [scheduled|live|upcoming|previous]")
        print("  create-meeting <topic> <start_time> [duration]")
        print("  get-meeting <id>")
        print("  get-summary <id>")
        print("  watch-summaries [--out file.json]")
        sys.exit(1)

    cmd = sys.argv[1]
    args = sys.argv[2:]
    client = ZoomClient()

    try:
        if cmd == 'list-meetings':
            res = client.list_meetings(*args)
            print(json.dumps(res, indent=2))
        elif cmd == 'create-meeting':
            if len(args) < 2:
                print("Missing arguments. create-meeting <topic> <start_time> [duration]")
                sys.exit(1)
            res = client.create_meeting(*args)
            print(json.dumps(res, indent=2))
        elif cmd == 'get-meeting':
            res = client.get_meeting(args[0])
            print(json.dumps(res, indent=2))
        elif cmd == 'get-summary':
            res = client.get_summary(args[0])
            print(json.dumps(res, indent=2))
        elif cmd == 'watch-summaries':
            out_path = '/tmp/zoom_summaries.json'
            if '--out' in args:
                out_path = args[args.index('--out') + 1]
            watch_summaries(client, out_path)
        else:
            print(f"Unknown command: {cmd}")
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
