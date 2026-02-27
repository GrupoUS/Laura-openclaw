#!/usr/bin/env python3
"""
Importa todos os leads da planilha de tráfego para o CRM consolidado.
Consolida múltiplas abas por produto em uma única aba do CRM.
"""
import json, sys, time, subprocess, re
from collections import defaultdict

# === CONFIG ===
SOURCE_ID = "13cap0yTRvtF96svph71CUMRcgA48W2rYjhgldYJu-us"
CRM_ID    = "1IsSXJmPkKMZrXK3c3QBrJH_Z4FN3ppAVZ5XkJhEBU0E"

# Mapeamento: nome da aba fonte → aba destino no CRM
TAB_MAP = {
    # TRINTAE3
    "CADASTROS TYPE TRINTAE3":                         "TRINTAE3",
    "CADASTROS TYPE TRINTAE3(RAFAEL)":                 "TRINTAE3",
    "[TRINTAE3] [LEADS TYPEBOT] [18/12/2025]":         "TRINTAE3",
    "[TRINTAE3] [LEADS TYPEBOT] [19/12/2024]":         "TRINTAE3",
    "[T5 e T6] [Captação TRINTAE3] Pós graduação 2025":"TRINTAE3",
    "[2025] [DISTRIBUIÇÃO TRINTAE3] Conteúdos":        "TRINTAE3",
    "[TRINTAE3] Pós graduação":                        "TRINTAE3",
    "Leads Type (TRINTAE3)":                           "TRINTAE3",
    "[TRINTAE3] Trackemanto":                          "TRINTAE3",
    "TRINTAE3 - Controle e Gestão Leads ":             "TRINTAE3",
    "[TRINTAE3] [LEADS FORMS NATIVO] [21/05/2025]":    "TRINTAE3",
    "[NAMESA] [LEADS TYPEBOT]":                        "NA MESA 🟤",
    "[TRINTAE3] Stract":                               "TRINTAE3",
    # OTB
    "[T3] [OTB] Out of The Box":                       "OTB 2025",
    "[T2] [OTB] Out of The Box":                       "OTB 2025",
    "[OTB] Out of The Box":                            "OTB 2025",
    "Leads Type (OTB)":                                "OTB 2025",
    # COMU US
    "[COMU US]":                                       "COMU US",
    # Aurículo
    "[AURÍCULO]  ":                                    "Aurículo",
    # NA MESA
    "[NAMESA]":                                        "NA MESA 🟤",
}

# Headers do CRM (destino)
CRM_HEADERS = ["Nome Completo","WhatsApp","Email","Cidade","Estado","Profissão",
               "Área de Atuação","Experiência","Produto de Interesse","Temperatura",
               "Status SDR","Data 1º Contato","Data Último Contato","Fonte/Campanha",
               "UTM Source","UTM Medium","UTM Campaign","Observações","Nome Closer",
               "Data Handoff","Status Comercial","Data Venda","Valor"]

def get_token():
    tok = json.load(open("/tmp/gog_tok.json"))
    secret = json.load(open("/Users/mauricio/.config/gog/client_secret.json"))
    w = secret.get("web", secret.get("installed", {}))
    import urllib.request, urllib.parse
    data = urllib.parse.urlencode({
        "client_id": w["client_id"],
        "client_secret": w["client_secret"],
        "refresh_token": tok["refresh_token"],
        "grant_type": "refresh_token"
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
    resp = json.loads(urllib.request.urlopen(req).read())
    return resp["access_token"]

def sheets_get(access, spreadsheet_id, range_):
    import urllib.request
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{urllib.parse.quote(range_)}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {access}"})
    try:
        return json.loads(urllib.request.urlopen(req).read())
    except Exception as e:
        return {"error": str(e)}

def sheets_append(access, spreadsheet_id, range_, values):
    import urllib.request, urllib.parse
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{urllib.parse.quote(range_)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS"
    data = json.dumps({"values": values}).encode()
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Bearer {access}",
        "Content-Type": "application/json"
    }, method="POST")
    try:
        resp = json.loads(urllib.request.urlopen(req).read())
        return resp.get("updates", {}).get("updatedRows", 0)
    except Exception as e:
        return 0

def get_spreadsheet_tabs(access, spreadsheet_id):
    import urllib.request
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}?fields=sheets.properties"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {access}"})
    resp = json.loads(urllib.request.urlopen(req).read())
    return {s["properties"]["title"]: s["properties"]["sheetId"] for s in resp.get("sheets", [])}

def normalize_phone(p):
    if not p:
        return ""
    digits = re.sub(r'\D', '', str(p))
    if len(digits) >= 10:
        return digits
    return ""

def normalize_email(e):
    if not e:
        return ""
    e = str(e).strip().lower()
    if "@" in e and "." in e.split("@")[-1]:
        return e
    return ""

def find_col(headers, *candidates):
    """Find column index by candidate names (case-insensitive partial match)"""
    hl = [h.lower().strip() for h in headers]
    for c in candidates:
        cl = c.lower()
        for i, h in enumerate(hl):
            if cl in h or h in cl:
                return i
    return -1

def extract_lead(row, headers):
    """Extract lead data from a source row, mapping to CRM columns"""
    def get(idx):
        if idx < 0 or idx >= len(row):
            return ""
        return str(row[idx]).strip()

    name_idx  = find_col(headers, "nome", "name")
    phone_idx = find_col(headers, "whatsapp", "telefone", "phone", "celular", "fone")
    email_idx = find_col(headers, "email", "e-mail")
    city_idx  = find_col(headers, "cidade", "city")
    state_idx = find_col(headers, "estado", "state", "uf")
    prof_idx  = find_col(headers, "profissão", "profissao", "profession", "ocupação", "area")
    src_idx   = find_col(headers, "fonte", "source", "utm_source", "utm source", "canal")
    utm_c_idx = find_col(headers, "utm_campaign", "campaign", "campanha")
    utm_m_idx = find_col(headers, "utm_medium", "medium")
    date_idx  = find_col(headers, "data", "created", "criado", "timestamp")

    name  = get(name_idx)
    phone = normalize_phone(get(phone_idx))
    email = normalize_email(get(email_idx))

    # Skip if no useful data
    if not name and not phone and not email:
        return None
    # Skip header-like rows
    if name.lower() in ("nome", "name", "nome completo"):
        return None

    row_out = [""] * len(CRM_HEADERS)
    row_out[0]  = name
    row_out[1]  = phone
    row_out[2]  = email
    row_out[3]  = get(city_idx)
    row_out[4]  = get(state_idx)
    row_out[5]  = get(prof_idx)
    row_out[11] = get(date_idx)
    row_out[13] = get(src_idx)
    row_out[14] = get(src_idx)
    row_out[15] = get(utm_m_idx)
    row_out[16] = get(utm_c_idx)
    return row_out

import urllib.parse

def main():
    print("🔑 Obtendo token...")
    access = get_token()

    print("📋 Listando abas do CRM destino...")
    crm_tabs = get_spreadsheet_tabs(access, CRM_ID)
    print(f"   Abas CRM: {list(crm_tabs.keys())}")

    print("\n📊 Listando abas da planilha fonte...")
    src_tabs = get_spreadsheet_tabs(access, SOURCE_ID)
    print(f"   Total abas fonte: {len(src_tabs)}")

    # Agrupar dados por aba destino
    # Primeiro, ler dados existentes do CRM para dedup
    print("\n🔍 Lendo leads existentes no CRM para deduplicação...")
    existing_keys = defaultdict(set)  # dest_tab -> set of (email|phone) keys
    
    for dest_tab in set(TAB_MAP.values()):
        if dest_tab not in crm_tabs:
            print(f"   ⚠️  Aba '{dest_tab}' não encontrada no CRM, pulando leitura")
            continue
        resp = sheets_get(access, CRM_ID, f"{dest_tab}!A2:C10000")
        rows = resp.get("values", [])
        for row in rows:
            if len(row) > 2:
                email = normalize_email(row[2]) if len(row) > 2 else ""
                phone = normalize_phone(row[1]) if len(row) > 1 else ""
                if email:
                    existing_keys[dest_tab].add(email)
                if phone:
                    existing_keys[dest_tab].add(phone)
        print(f"   {dest_tab}: {len(existing_keys[dest_tab])} chaves existentes")

    # Processar cada aba fonte
    leads_by_dest = defaultdict(list)
    seen_keys_new = defaultdict(set)
    stats = defaultdict(lambda: {"read": 0, "added": 0, "skipped": 0})

    for tab_name, dest_tab in TAB_MAP.items():
        # Find actual tab name (handle trailing spaces)
        actual_name = None
        for t in src_tabs:
            if t.strip() == tab_name.strip():
                actual_name = t
                break
        
        if not actual_name:
            print(f"\n⚠️  Aba não encontrada: '{tab_name}' - pulando")
            continue

        print(f"\n📥 Lendo: '{actual_name}' → '{dest_tab}'")
        resp = sheets_get(access, SOURCE_ID, f"{actual_name}!A1:Z5000")
        rows = resp.get("values", [])
        
        if not rows or len(rows) < 2:
            print(f"   Vazia ou sem dados")
            continue

        headers = [str(h).strip() for h in rows[0]]
        data_rows = rows[1:]
        stats[dest_tab]["read"] += len(data_rows)
        print(f"   {len(data_rows)} linhas | Headers: {headers[:6]}...")

        for row in data_rows:
            lead = extract_lead(row, headers)
            if not lead:
                stats[dest_tab]["skipped"] += 1
                continue

            email = lead[2]
            phone = lead[1]
            
            # Dedup contra existentes + novos nesta rodada
            key = email or phone
            if not key:
                stats[dest_tab]["skipped"] += 1
                continue
            
            if key in existing_keys[dest_tab] or key in seen_keys_new[dest_tab]:
                stats[dest_tab]["skipped"] += 1
                continue
            
            seen_keys_new[dest_tab].add(key)
            if email:
                seen_keys_new[dest_tab].add(email)
            if phone:
                seen_keys_new[dest_tab].add(phone)
            
            leads_by_dest[dest_tab].append(lead)
            stats[dest_tab]["added"] += 1

    # Escrever no CRM em lotes
    print("\n\n✍️  Escrevendo no CRM...")
    BATCH_SIZE = 500
    
    for dest_tab, leads in leads_by_dest.items():
        if not leads:
            print(f"   {dest_tab}: nenhum lead novo")
            continue
        
        if dest_tab not in crm_tabs:
            print(f"   ⚠️  Aba '{dest_tab}' não existe no CRM - pulando")
            continue

        total_written = 0
        for i in range(0, len(leads), BATCH_SIZE):
            batch = leads[i:i+BATCH_SIZE]
            written = sheets_append(access, CRM_ID, f"{dest_tab}!A1", batch)
            total_written += written
            print(f"   {dest_tab}: lote {i//BATCH_SIZE+1} — {written} linhas escritas")
            time.sleep(0.5)  # rate limit
        
        print(f"   ✅ {dest_tab}: {total_written} leads adicionados")

    # Resumo final
    print("\n\n📊 RESUMO FINAL:")
    print("="*60)
    for dest_tab in set(TAB_MAP.values()):
        s = stats[dest_tab]
        print(f"  {dest_tab}:")
        print(f"    Lidos: {s['read']} | Adicionados: {s['added']} | Pulados(dup/vazio): {s['skipped']}")
    print("="*60)
    print("✅ Importação concluída!")

if __name__ == "__main__":
    main()
