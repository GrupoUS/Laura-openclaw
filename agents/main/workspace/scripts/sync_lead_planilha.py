#!/usr/bin/env python3
"""
sync_lead_planilha.py — Registra um lead na planilha de sincronização com o NeonDash CRM.

Uso:
    python3 sync_lead_planilha.py \
        --nome "Ana Silva" \
        --email "ana@email.com" \
        --telefone "5511999999999" \
        --profissao "Enfermeira" \
        --produto "TRINTAE3" \
        --temperatura "quente" \
        --dor "Insegurança na prática" \
        --desejo "Ter certificação e autonomia" \
        --data "27/02/2026"
"""

import json, urllib.request, urllib.parse, argparse, subprocess, os, datetime

SHEET_ID = '1M8ocHxKT219YzRanFyhGcrlxDQhQqK6FZv0AgmF_IOE'
PRODUTOS_TABS = {'TRINTAE3': 'TRINTAE3', 'NEON': 'Neon', 'OTB': 'OTB'}

def get_access_token():
    result = subprocess.run(
        ['gog', 'auth', 'tokens', 'export', 'suporte@drasacha.com.br', '--out', '/tmp/gog_lead_sync.json'],
        capture_output=True, text=True
    )
    with open('/tmp/gog_lead_sync.json') as f:
        tok = json.load(f)
    with open('/Users/mauricio/.config/gog/client_secret.json') as f:
        sec = json.load(f)
    os.remove('/tmp/gog_lead_sync.json')

    body = urllib.parse.urlencode({
        'client_id': sec['installed']['client_id'],
        'client_secret': sec['installed']['client_secret'],
        'refresh_token': tok['refresh_token'],
        'grant_type': 'refresh_token'
    }).encode()
    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=body,
        headers={'Content-Type': 'application/x-www-form-urlencoded'})
    return json.loads(urllib.request.urlopen(req).read())['access_token']

def append_lead(access_token, tab, row):
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/{urllib.parse.quote(tab)}!A:Q:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS'
    payload = {'values': [row]}
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
        headers={'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'},
        method='POST')
    result = json.loads(urllib.request.urlopen(req).read())
    return result.get('updates', {}).get('updatedRange', 'OK')

def main():
    parser = argparse.ArgumentParser(description='Registra lead na planilha de sync CRM')
    parser.add_argument('--nome',       required=True)
    parser.add_argument('--email',      default='')
    parser.add_argument('--telefone',   required=True, help='Apenas dígitos com DDI: 5511999999999')
    parser.add_argument('--profissao',  default='')
    parser.add_argument('--produto',    required=True, choices=['TRINTAE3', 'NEON', 'OTB'])
    parser.add_argument('--temperatura',default='morno', choices=['frio', 'morno', 'quente'])
    parser.add_argument('--dor',        default='')
    parser.add_argument('--desejo',     default='')
    parser.add_argument('--data',       default=datetime.date.today().strftime('%d/%m/%Y'))
    parser.add_argument('--anos',       default='')
    parser.add_argument('--faturamento',default='')
    args = parser.parse_args()

    tab = PRODUTOS_TABS[args.produto]

    # Colunas: Nome, Email, Telefone, Empresa, Origem, Etapa, Valor Estimado, Temperatura,
    #          Tags, Indicado Por, Profissão, Produto Interesse, Dor Principal, Desejo Principal,
    #          Criado Em, Anos Estética, Faturamento Mensal
    row = [
        args.nome, args.email, args.telefone, '',
        'whatsapp', 'Qualificação', '', args.temperatura,
        'Laura SDR', 'Laura', args.profissao, args.produto,
        args.dor, args.desejo, args.data, args.anos, args.faturamento
    ]

    token = get_access_token()
    range_result = append_lead(token, tab, row)
    print(f"✅ Lead '{args.nome}' registrado em {tab} | {range_result}")

if __name__ == '__main__':
    main()
