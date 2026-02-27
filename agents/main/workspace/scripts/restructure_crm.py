#!/usr/bin/env python3
"""
Reestrutura o CRM para 30 colunas padronizadas (igual em todas as abas).
Corrige também o OTB 2025 onde os dados foram importados nas colunas erradas.
"""
import json, re, time, urllib.request, urllib.parse

CRM_ID = "1IsSXJmPkKMZrXK3c3QBrJH_Z4FN3ppAVZ5XkJhEBU0E"

NEW_HEADERS = [
    "Nome",               # 0
    "Email",              # 1
    "Telefone",           # 2
    "Empresa",            # 3
    "Origem",             # 4
    "Etapa",              # 5
    "Valor Estimado",     # 6
    "Temperatura",        # 7
    "Tags",               # 8
    "Indicado Por",       # 9
    "Profissão",          # 10
    "Produto Interesse",  # 11
    "Dor Principal",      # 12
    "Desejo Principal",   # 13
    "Criado Em",          # 14
    "pipelineId",         # 15
    "stageId",            # 16
    "Instagram",          # 17
    "Cidade / Estado",    # 18
    "Já Atua na Área?",   # 19
    "Tempo de Experiência", # 20
    "Criativo / Campanha",  # 21
    "Notas SDR",          # 22
    "Data Handoff",       # 23
    "Closer Responsável", # 24
    "Status Comercial",   # 25
    "Motivo Perda",       # 26
    "Data Fechamento",    # 27
    "Turma / Início",     # 28
    "Observações",        # 29
]
N = len(NEW_HEADERS)  # 30

def get_token():
    tok    = json.load(open("/tmp/gog_tok.json"))
    secret = json.load(open("/Users/mauricio/.config/gog/client_secret.json"))
    w      = secret.get("web", secret.get("installed", {}))
    data   = urllib.parse.urlencode({
        "client_id": w["client_id"], "client_secret": w["client_secret"],
        "refresh_token": tok["refresh_token"], "grant_type": "refresh_token"
    }).encode()
    return json.loads(urllib.request.urlopen(
        urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
    ).read())["access_token"]

def api(access, method, path, body=None):
    url  = f"https://sheets.googleapis.com/v4/spreadsheets/{CRM_ID}{path}"
    data = json.dumps(body).encode() if body else None
    hdrs = {"Authorization": f"Bearer {access}"}
    if data: hdrs["Content-Type"] = "application/json"
    req  = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    return json.loads(urllib.request.urlopen(req).read())

def g(row, idx):
    return row[idx].strip() if 0 <= idx < len(row) else ""

def new_row():
    return [""] * N

def transform_standard(row):
    """TRINTAE3 / NEON / COMU US — headers corretos, dados alinhados
    0:Data Entrada, 1:Nome Completo, 2:WhatsApp, 3:Email, 4:Instagram,
    5:Cidade/Estado, 6:Profissão, 7:Já Atua, 8:Tempo Exp, 9:Origem,
    10:Criativo, 11:Temperatura, 12:Status SDR, 13:Objeção, 14:Notas SDR,
    15:Data Handoff, 16:Closer, 17:Status Comercial, 18:Motivo Perda,
    19:Data Fechamento, 20:Turma, 21:Observações
    """
    r = new_row()
    r[0]  = g(row,1)   # Nome Completo → Nome
    r[1]  = g(row,3)   # Email
    r[2]  = g(row,2)   # WhatsApp → Telefone
    r[4]  = g(row,9)   # Origem do Lead → Origem
    r[5]  = g(row,12)  # Status SDR → Etapa
    r[7]  = g(row,11)  # Temperatura
    r[10] = g(row,6)   # Profissão / Especialidade → Profissão
    r[12] = g(row,13)  # Objeção Principal → Dor Principal
    r[14] = g(row,0)   # Data Entrada → Criado Em
    r[17] = g(row,4)   # Instagram
    r[18] = g(row,5)   # Cidade / Estado
    r[19] = g(row,7)   # Já Atua na Área?
    r[20] = g(row,8)   # Tempo de Experiência
    r[21] = g(row,10)  # Criativo / Campanha
    r[22] = g(row,14)  # Notas SDR
    r[23] = g(row,15)  # Data Handoff
    r[24] = g(row,16)  # Closer Responsável
    r[25] = g(row,17)  # Status Comercial
    r[26] = g(row,18)  # Motivo Perda
    r[27] = g(row,19)  # Data Fechamento
    r[28] = g(row,20)  # Turma / Início
    r[29] = g(row,21)  # Observações
    return r

def transform_otb(row):
    """OTB 2025 — dados importados com offset errado (sem header #ID e Data Entrada)
    Dados reais nas posições:
    0:Nome, 1:Telefone, 2:Email, 3:vazio, 4:vazio, 5:Profissão,
    6:vazio, 7:vazio, 8:Produto("OTB 2025"), 9:vazio, 10:vazio, 11:Data
    """
    r = new_row()
    r[0]  = g(row,0)   # Nome
    r[1]  = g(row,2)   # Email
    r[2]  = g(row,1)   # Telefone
    r[10] = g(row,5)   # Profissão
    r[11] = g(row,8)   # Produto Interesse
    r[14] = g(row,11)  # Criado Em (data ISO)
    return r

def transform_namesa(row):
    """NA MESA 🟤 — headers próprios (23 colunas)
    0:Nome Completo, 1:WhatsApp, 2:Email, 3:Cidade, 4:Estado,
    5:Profissão, 6:Área de Atuação, 7:Experiência, 8:Produto de Interesse,
    9:Temperatura, 10:Status SDR, 11:Data 1º Contato, 12:Data Último Contato,
    13:Fonte/Campanha, 14:UTM Source, 15:UTM Medium, 16:UTM Campaign,
    17:Observações, 18:Nome Closer, 19:Data Handoff, 20:Status Comercial,
    21:Data Venda, 22:Valor
    """
    r = new_row()
    r[0]  = g(row,0)   # Nome Completo → Nome
    r[1]  = g(row,2)   # Email
    r[2]  = g(row,1)   # WhatsApp → Telefone
    r[4]  = g(row,13)  # Fonte/Campanha → Origem
    r[5]  = g(row,10)  # Status SDR → Etapa
    r[6]  = g(row,22)  # Valor → Valor Estimado
    r[7]  = g(row,9)   # Temperatura
    r[10] = g(row,5)   # Profissão
    r[11] = g(row,8)   # Produto de Interesse
    r[14] = g(row,11)  # Data 1º Contato → Criado Em
    r[18] = (g(row,3) + (" / " + g(row,4) if g(row,4) else "")).strip(" / ")  # Cidade + Estado
    r[20] = g(row,7)   # Experiência → Tempo de Experiência
    r[21] = g(row,16)  # UTM Campaign → Criativo/Campanha
    r[22] = g(row,6)   # Área de Atuação → Notas SDR
    r[23] = g(row,19)  # Data Handoff
    r[24] = g(row,18)  # Nome Closer → Closer Responsável
    r[25] = g(row,20)  # Status Comercial
    r[27] = g(row,21)  # Data Venda → Data Fechamento
    r[29] = g(row,17)  # Observações
    return r

def transform_auricular(row):
    """Aurículo — igual TRINTAE3 mas com #ID extra na col 0 (shift +1)
    0:#ID, 1:Data Entrada, 2:Nome Completo, 3:WhatsApp, 4:Email, ...
    """
    r = new_row()
    r[0]  = g(row,2)   # Nome Completo
    r[1]  = g(row,4)   # Email
    r[2]  = g(row,3)   # WhatsApp → Telefone
    r[4]  = g(row,10)  # Origem do Lead
    r[5]  = g(row,13)  # Status SDR → Etapa
    r[7]  = g(row,12)  # Temperatura
    r[10] = g(row,7)   # Profissão
    r[12] = g(row,14)  # Objeção Principal → Dor Principal
    r[14] = g(row,1)   # Data Entrada → Criado Em
    r[17] = g(row,5)   # Instagram
    r[18] = g(row,6)   # Cidade / Estado
    r[19] = g(row,8)   # Já Atua na Área?
    r[20] = g(row,9)   # Tempo de Experiência
    r[21] = g(row,11)  # Criativo / Campanha
    r[22] = g(row,15)  # Notas SDR
    r[23] = g(row,16)  # Data Handoff
    r[24] = g(row,17)  # Closer Responsável
    r[25] = g(row,18)  # Status Comercial
    r[26] = g(row,19)  # Motivo Perda
    r[27] = g(row,20)  # Data Fechamento
    r[28] = g(row,21)  # Turma / Início
    r[29] = g(row,22)  # Observações
    return r

CONFIGS = {
    "TRINTAE3":    transform_standard,
    "NEON":        transform_standard,
    "OTB 2025":    transform_otb,
    "COMU US":     transform_standard,
    "NA MESA 🟤":  transform_namesa,
    "Aurículo":    transform_auricular,
}

def process_tab(access, tab, transform_fn):
    print(f"\n{'='*55}")
    print(f"📋 {tab}")

    # Ler todos os dados
    rows = api(access, "GET", f"/values/{urllib.parse.quote(tab)}!A1:Z10000").get("values", [])
    if len(rows) < 2:
        print("   Vazia — só atualiza header")
        data_rows = []
    else:
        data_rows = rows[1:]
        print(f"   {len(data_rows)} linhas de dados")

    # Transformar
    clean = []
    for row in data_rows:
        new = transform_fn(row)
        # Só incluir se tiver pelo menos Nome ou Telefone
        if new[0] or new[2]:
            clean.append(new)
    print(f"   {len(clean)} linhas válidas após transformação")

    # Amostras
    if clean:
        print(f"   Amostra R1: Nome={clean[0][0]} | Tel={clean[0][2]} | Email={clean[0][1]} | CriadoEm={clean[0][14]}")
        if len(clean) > 1:
            print(f"   Amostra R2: Nome={clean[1][0]} | Tel={clean[1][2]} | Email={clean[1][1]}")

    # Limpar aba
    api(access, "POST", "/values:batchClear", {"ranges": [f"{tab}!A1:Z10000"]})
    time.sleep(0.8)

    # Escrever header
    api(access, "POST",
        f"/values/{urllib.parse.quote(tab)}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS",
        {"values": [NEW_HEADERS]})

    # Escrever dados em lotes
    if clean:
        BATCH = 1000
        written = 0
        for i in range(0, len(clean), BATCH):
            batch = clean[i:i+BATCH]
            res = api(access, "POST",
                f"/values/{urllib.parse.quote(tab)}!A2:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS",
                {"values": batch})
            written += res.get("updates", {}).get("updatedRows", len(batch))
            time.sleep(0.5)
        print(f"   ✅ {written} linhas escritas com novo formato")
    else:
        print("   ✅ Header atualizado (sem dados)")

def main():
    print("🔑 Obtendo token...")
    access = get_token()

    for tab, fn in CONFIGS.items():
        process_tab(access, tab, fn)
        time.sleep(1)

    print("\n\n🎉 REESTRUTURAÇÃO CONCLUÍDA!")
    print(f"   {N} colunas padronizadas em todas as abas.")

if __name__ == "__main__":
    main()
