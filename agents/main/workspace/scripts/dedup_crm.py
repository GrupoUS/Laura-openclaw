#!/usr/bin/env python3
"""
Deduplicação e limpeza do CRM:
- Remove duplicatas (por email e/ou telefone)
- Remove leads sem número de telefone
"""
import json, re, time, urllib.request, urllib.parse

CRM_ID = "1IsSXJmPkKMZrXK3c3QBrJH_Z4FN3ppAVZ5XkJhEBU0E"
TABS   = ["TRINTAE3", "NEON", "OTB 2025", "COMU US", "Aurículo", "Lead Frio", "NA MESA 🟤"]

def get_token():
    tok    = json.load(open("/tmp/gog_tok.json"))
    secret = json.load(open("/Users/mauricio/.config/gog/client_secret.json"))
    w      = secret.get("web", secret.get("installed", {}))
    data   = urllib.parse.urlencode({
        "client_id": w["client_id"], "client_secret": w["client_secret"],
        "refresh_token": tok["refresh_token"], "grant_type": "refresh_token"
    }).encode()
    resp = json.loads(urllib.request.urlopen(
        urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
    ).read())
    return resp["access_token"]

def api(access, method, path, body=None):
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{CRM_ID}{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Authorization": f"Bearer {access}"}
    if data:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    return json.loads(urllib.request.urlopen(req).read())

def normalize_phone(p):
    if not p: return ""
    d = re.sub(r'\D', '', str(p))
    return d if len(d) >= 10 else ""

def normalize_email(e):
    if not e: return ""
    e = str(e).strip().lower()
    return e if "@" in e and "." in e.split("@")[-1] else ""

def dedup_tab(access, tab):
    print(f"\n{'='*50}")
    print(f"📋 {tab}")
    
    # Ler tudo
    resp = api(access, "GET", f"/values/{urllib.parse.quote(tab)}!A1:X50000")
    rows = resp.get("values", [])
    if len(rows) < 2:
        print("   Vazia — pulando")
        return

    headers = rows[0]
    data    = rows[1:]
    print(f"   Total bruto: {len(data)} linhas")

    # Detectar índices de phone e email
    hl = [h.lower().strip() for h in headers]
    phone_idx = next((i for i,h in enumerate(hl) if any(x in h for x in ["whatsapp","telefone","phone","celular"])), 1)
    email_idx = next((i for i,h in enumerate(hl) if "email" in h or "e-mail" in h), 2)

    seen_phone = set()
    seen_email = set()
    clean = []
    removed_no_phone = 0
    removed_dup = 0

    for row in data:
        # Pad row
        while len(row) < len(headers):
            row.append("")

        phone = normalize_phone(row[phone_idx] if phone_idx < len(row) else "")
        email = normalize_email(row[email_idx] if email_idx < len(row) else "")

        # Remover sem telefone
        if not phone:
            removed_no_phone += 1
            continue

        # Dedup por telefone
        if phone in seen_phone:
            removed_dup += 1
            continue
        seen_phone.add(phone)

        # Dedup por email (se tiver)
        if email:
            if email in seen_email:
                removed_dup += 1
                continue
            seen_email.add(email)

        clean.append(row)

    print(f"   Sem telefone: {removed_no_phone} | Duplicatas: {removed_dup} | Únicos: {len(clean)}")

    if removed_no_phone == 0 and removed_dup == 0:
        print("   ✅ Já está limpo!")
        return

    # Limpar a aba (batchClear)
    api(access, "POST", f"/values:batchClear",
        {"ranges": [f"{tab}!A2:X50000"]})
    time.sleep(1)

    # Reescrever em lotes
    BATCH = 1000
    total_written = 0
    for i in range(0, len(clean), BATCH):
        batch = clean[i:i+BATCH]
        result = api(access, "POST",
            f"/values/{urllib.parse.quote(tab)}!A2:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS",
            {"values": batch})
        written = result.get("updates", {}).get("updatedRows", len(batch))
        total_written += written
        print(f"   Lote {i//BATCH+1}: {written} linhas escritas")
        time.sleep(0.5)

    print(f"   ✅ Finalizado: {total_written} leads únicos com telefone")

def main():
    print("🔑 Obtendo token...")
    access = get_token()

    for tab in TABS:
        dedup_tab(access, tab)
        time.sleep(1)

    print("\n\n🎉 DEDUPLICAÇÃO CONCLUÍDA EM TODAS AS ABAS!")

if __name__ == "__main__":
    main()
