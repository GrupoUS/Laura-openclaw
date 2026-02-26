#!/usr/bin/env python3
"""
CRM Importer — Grupo US
Lê planilhas xlsx/csv, detecta tipo (leads/financeiro/tráfego),
mapeia colunas e importa apenas leads para o Google Sheets CRM.

Uso:
    python3 crm_importer.py <arquivo.xlsx> [--produto TRINTAE3] [--dry-run]
"""

import sys, os, json, re, csv, argparse
import urllib.request, urllib.parse
from datetime import datetime
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit("❌ Instale openpyxl: pip3 install openpyxl --break-system-packages")

# ── Configuração ──────────────────────────────────────────────────────────────
SPREADSHEET_ID = "1IsSXJmPkKMZrXK3c3QBrJH_Z4FN3ppAVZ5XkJhEBU0E"
TOKEN_FILE     = "/tmp/gog_token_import.json"

GOG_CLIENT_ID     = os.environ.get("GOG_CLIENT_ID", "")
GOG_CLIENT_SECRET = os.environ.get("GOG_CLIENT_SECRET", "")

# ── Produtos reconhecidos ─────────────────────────────────────────────────────
PRODUTOS = ["TRINTAE3", "NEON", "OTB 2025", "COMU US", "Aurículo", "Lead Frio"]

PRODUTO_KEYWORDS = {
    "TRINTAE3":  ["trintae3","trinta","33","pos","pós","estetica","estética","saude","saúde","534"],
    "NEON":      ["neon","nêon","mentoria","black","individual","gestao","gestão","clinica","clínica"],
    "OTB 2025":  ["otb","out of the box","harvard","cadaver","mba","eua","usa","visto"],
    "COMU US":   ["comu","comunidade","community","grupo us"],
    "Aurículo":  ["auriculo","aurículo","auriculoterapia","sacha"],
}

# ── Mapeamento inteligente de colunas → campos CRM ───────────────────────────
# Cada campo CRM mapeia para uma lista de nomes de coluna possíveis (lowercase, sem acento)
FIELD_MAP = {
    "Nome Completo":          ["nome","name","nome completo","cliente","lead","contato","aluno","paciente","responsavel","responsável"],
    "WhatsApp":               ["whatsapp","whats","celular","telefone","fone","phone","cel","numero","número","contato","tel"],
    "Email":                  ["email","e-mail","e mail","correio","mail"],
    "Instagram":              ["instagram","insta","ig","arroba","@"],
    "Cidade / Estado":        ["cidade","city","estado","state","localidade","uf","municipio","município","cidade/estado","cidade / estado"],
    "Profissão / Especialidade": ["profissao","profissão","especialidade","area","área","cargo","ocupacao","ocupação","formacao","formação","especialização"],
    "Já Atua na Área?":       ["atua","ja atua","já atua","atuacao","atuação","experiencia pratica","ativo","ativa"],
    "Tempo de Experiência":   ["experiencia","experiência","tempo","anos","atuando","tempo de experiencia"],
    "Origem do Lead":         ["origem","source","canal","midia","mídia","campanha origem","utm_source","trafego","tráfego","captacao","captação"],
    "Criativo / Campanha":    ["criativo","campanha","utm_campaign","anuncio","anúncio","ad","crm","creativo"],
    "Temperatura":            ["temperatura","temp","status lead","qualidade","score","quente","frio","morno"],
    "Status SDR":             ["status","status sdr","etapa","estagio","estágio","fase","funil"],
    "Objeção Principal":      ["objecao","objeção","objecoes","objeções","duvida","dúvida","resistencia","resistência"],
    "Notas SDR":              ["nota","notes","anotacao","anotação","observacao sdr","comentario sdr","comentário sdr","historico","histórico"],
    "Data Handoff":           ["data handoff","data passagem","handoff","transferencia","transferência"],
    "Closer Responsável":     ["closer","vendedor","consultor","responsavel","responsável","atendente"],
    "Status Comercial":       ["status comercial","negociacao","negociação","venda","proposta","resultado"],
    "Motivo Perda":           ["motivo perda","perda","lost reason","porque perdeu","razão perda"],
    "Data Fechamento":        ["data fechamento","fechamento","data venda","data conversao","data conversão","compra"],
    "Turma / Início":         ["turma","inicio","início","turma inicio","data inicio","data início","class","batch"],
    "Produto de Interesse":   ["produto","produto de interesse","produto interesse","interesse","curso","formacao interesse","formação interesse"],
    "Observações":            ["observacoes","observações","obs","comentario","comentário","comments","notas","extra"],
    "Data Entrada":           ["data entrada","data","date","criado em","criado","created","data cadastro","data contato","data lead","cadastro"],
}

# Colunas que indicam dados FINANCEIROS (não leads)
FINANCIAL_SIGNALS = [
    "valor","receita","revenue","faturamento","lucro","margem","custo","ticket","mrr","arr",
    "parcela","installment","nf","nota fiscal","boleto","pix","cartao","cartão","pagamento",
    "comissao","comissão","imposto","taxa","fee","desconto","chargeback","reembolso","refund",
    "inadimplente","vencimento","pago","pendente pagamento","saldo","extrato","dre"
]

# Colunas que indicam dados de TRÁFEGO/ADS (não leads)
TRAFFIC_SIGNALS = [
    "impressoes","impressões","impressions","cliques","clicks","ctr","cpc","cpm","roas",
    "conversoes","conversões","conversions","alcance","reach","frequencia","frequência",
    "spend","budget","gasto","investimento ads","custo por lead","custo por resultado",
    "account id","campaign id","ad set","adset","ad id","creative","placement",
    "utm_term","utm_content","utm_medium"
]

# ── Utilitários ───────────────────────────────────────────────────────────────
def normalize(s):
    """Remove acentos e lowercase para comparação"""
    s = str(s).lower().strip()
    s = re.sub(r'[áàãâä]','a',s)
    s = re.sub(r'[éèêë]','e',s)
    s = re.sub(r'[íìîï]','i',s)
    s = re.sub(r'[óòõôö]','o',s)
    s = re.sub(r'[úùûü]','u',s)
    s = re.sub(r'[ç]','c',s)
    return s

def score_column(col_name, signal_list):
    n = normalize(col_name)
    return sum(1 for sig in signal_list if sig in n or n in sig)

def detect_sheet_type(headers):
    """Retorna 'leads', 'financial', 'traffic' ou 'mixed'"""
    fin_score  = sum(score_column(h, FINANCIAL_SIGNALS) for h in headers)
    traf_score = sum(score_column(h, TRAFFIC_SIGNALS) for h in headers)
    lead_score = sum(1 for h in headers for field_aliases in FIELD_MAP.values()
                    if any(alias in normalize(h) or normalize(h) in alias for alias in field_aliases))
    
    print(f"  📊 Scores — leads:{lead_score} | financeiro:{fin_score} | tráfego:{traf_score}")
    
    if traf_score >= 3:  return "traffic"
    if fin_score >= 3:   return "financial"
    if lead_score >= 2:  return "leads"
    return "unknown"

def detect_product(headers, sheet_name="", file_name=""):
    """Tenta identificar o produto pelos headers, nome da aba ou arquivo"""
    text = normalize(f"{sheet_name} {file_name} {' '.join(str(h) for h in headers)}")
    scores = {}
    for prod, keywords in PRODUTO_KEYWORDS.items():
        scores[prod] = sum(1 for kw in keywords if kw in text)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else None

def map_columns(headers):
    """Retorna dict: índice_coluna → campo_CRM"""
    mapping = {}
    used_fields = set()
    for idx, header in enumerate(headers):
        h_norm = normalize(str(header))
        best_field = None
        best_score = 0
        for field, aliases in FIELD_MAP.items():
            if field in used_fields:
                continue
            for alias in aliases:
                if alias == h_norm or alias in h_norm or h_norm in alias:
                    score = len(alias)  # prefere match mais específico
                    if score > best_score:
                        best_score = score
                        best_field = field
        if best_field:
            mapping[idx] = best_field
            used_fields.add(best_field)
    return mapping

def normalize_phone(val):
    if not val: return ""
    digits = re.sub(r'\D','',str(val))
    if len(digits) == 11 and not digits.startswith('55'):
        return f"+55{digits}"
    if len(digits) == 13 and digits.startswith('55'):
        return f"+{digits}"
    return str(val).strip()

def normalize_date(val):
    if not val: return ""
    if isinstance(val, datetime):
        return val.strftime("%d/%m/%Y")
    s = str(val).strip()
    # tenta vários formatos
    for fmt in ["%Y-%m-%d","%d/%m/%Y","%d-%m-%Y","%m/%d/%Y","%Y/%m/%d"]:
        try:
            return datetime.strptime(s[:10], fmt).strftime("%d/%m/%Y")
        except: pass
    return s

def normalize_temperature(val):
    v = normalize(str(val))
    if any(x in v for x in ['quente','hot','3','alta','alto']): return "🟢 Quente"
    if any(x in v for x in ['morno','warm','2','medio','média','medio']): return "🟡 Morno"
    if any(x in v for x in ['frio','cold','1','baixa','baixo']): return "🔴 Frio"
    return val

def normalize_status_sdr(val):
    v = normalize(str(val))
    if 'qualificad' in v: return "Qualificado"
    if 'agendad' in v or 'agendar' in v: return "Agendado"
    if 'desqualificad' in v or 'nao qualif' in v: return "Desqualificado"
    if 'contato' in v or 'contato' in v: return "Em Contato"
    if 'no.show' in v or 'no show' in v or 'noshow' in v: return "No-Show"
    if 'novo' in v or 'new' in v: return "Novo"
    return val

def normalize_status_comercial(val):
    v = normalize(str(val))
    if 'ganho' in v or 'fechado' in v or 'won' in v or 'vendid' in v or 'comprou' in v: return "Ganho ✅"
    if 'perdid' in v or 'lost' in v or 'cancelad' in v: return "Perdido ❌"
    if 'proposta' in v: return "Proposta Enviada"
    if 'follow' in v: return "Em Follow-up"
    if 'negociacao' in v or 'negociando' in v: return "Em Negociação"
    return val

# Normalização por campo
FIELD_NORMALIZERS = {
    "WhatsApp": normalize_phone,
    "Data Entrada": normalize_date,
    "Data Handoff": normalize_date,
    "Data Fechamento": normalize_date,
    "Temperatura": normalize_temperature,
    "Status SDR": normalize_status_sdr,
    "Status Comercial": normalize_status_comercial,
}

# ── Leitura de arquivo ─────────────────────────────────────────────────────────
def read_xlsx(file_path):
    """Retorna lista de (sheet_name, headers, rows)"""
    wb = openpyxl.load_workbook(file_path, data_only=True)
    result = []
    for ws in wb.worksheets:
        rows = list(ws.iter_rows(values_only=True))
        if not rows: continue
        # pula abas completamente vazias
        non_empty = [r for r in rows if any(c is not None and str(c).strip() for c in r)]
        if not non_empty: continue
        # a primeira linha não-vazia é o header
        header_row_idx = next(i for i,r in enumerate(rows) if any(c for c in r))
        headers = [str(c) if c is not None else "" for c in rows[header_row_idx]]
        data_rows = rows[header_row_idx+1:]
        result.append((ws.title, headers, data_rows))
    return result

def read_csv(file_path):
    with open(file_path, encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        rows = list(reader)
    if not rows: return []
    return [(Path(file_path).stem, rows[0], rows[1:])]

# ── Google Sheets API ─────────────────────────────────────────────────────────
def get_access_token():
    with open(TOKEN_FILE) as f:
        data = json.load(f)
    refresh_token = data["refresh_token"]
    payload = urllib.parse.urlencode({
        "client_id": GOG_CLIENT_ID,
        "client_secret": GOG_CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=payload)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["access_token"]

def sheets_api(token, method, path, body=None):
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def get_next_id(token, sheet_name):
    """Retorna o próximo #ID disponível na aba"""
    try:
        result = sheets_api(token, "GET", f"/values/{urllib.parse.quote(sheet_name)}!A2:A")
        values = result.get("values", [])
        return len(values) + 1
    except:
        return 1

def append_to_sheet(token, sheet_name, rows_data):
    """Adiciona linhas à aba correta"""
    if not rows_data:
        return 0
    result = sheets_api(token, "POST",
        f"/values/{urllib.parse.quote(sheet_name)}!A:W:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS",
        {"values": rows_data}
    )
    return result.get("updates", {}).get("updatedRows", 0)

# ── CRM headers order ─────────────────────────────────────────────────────────
CRM_HEADERS = [
    "#ID","Data Entrada","Nome Completo","WhatsApp","Email","Instagram",
    "Cidade / Estado","Profissão / Especialidade","Já Atua na Área?",
    "Tempo de Experiência","Origem do Lead","Criativo / Campanha",
    "Temperatura","Status SDR","Objeção Principal","Notas SDR",
    "Data Handoff","Closer Responsável","Status Comercial",
    "Motivo Perda","Data Fechamento","Turma / Início","Observações"
]

# Headers específicos da aba Lead Frio (tem coluna extra "Produto de Interesse")
CRM_HEADERS_LEAD_FRIO = [
    "#ID","Data Entrada","Nome Completo","WhatsApp","Email","Instagram",
    "Cidade / Estado","Profissão / Especialidade","Já Atua na Área?",
    "Tempo de Experiência","Origem do Lead","Criativo / Campanha",
    "Temperatura","Produto de Interesse","Status SDR",
    "Objeção Principal","Notas SDR","Data Handoff",
    "Closer Responsável","Status Comercial","Motivo Perda",
    "Data Fechamento","Turma / Início","Observações"
]

# ── Pipeline principal ────────────────────────────────────────────────────────
def process_file(file_path, force_produto=None, dry_run=False):
    print(f"\n{'='*60}")
    print(f"📂 Processando: {Path(file_path).name}")
    print(f"{'='*60}")

    # leitura
    ext = Path(file_path).suffix.lower()
    if ext in ['.xlsx','.xls']:
        sheets = read_xlsx(file_path)
    elif ext == '.csv':
        sheets = read_csv(file_path)
    else:
        print(f"❌ Formato não suportado: {ext}")
        return

    if not sheets:
        print("❌ Arquivo vazio ou sem dados")
        return

    token = get_access_token() if not dry_run else None
    total_imported = 0
    total_skipped  = 0

    for sheet_name, headers, data_rows in sheets:
        print(f"\n  📋 Aba: '{sheet_name}' | {len(data_rows)} linhas | {len(headers)} colunas")

        # detectar tipo
        sheet_type = detect_sheet_type(headers)
        print(f"  🔍 Tipo detectado: {sheet_type.upper()}")

        if sheet_type in ["financial","traffic"]:
            print(f"  ⏩ Ignorando — dados de {sheet_type}")
            total_skipped += len(data_rows)
            continue

        if sheet_type == "unknown":
            print(f"  ⚠️  Tipo incerto — tentando importar mesmo assim")

        # detectar produto
        produto = force_produto or detect_product(headers, sheet_name, Path(file_path).stem)
        if not produto:
            # perguntar (modo interativo) ou default TRINTAE3
            print(f"  ❓ Produto não identificado — usando TRINTAE3 como padrão")
            produto = "TRINTAE3"
        print(f"  🎯 Produto: {produto}")

        # mapear colunas
        col_map = map_columns(headers)
        print(f"  🗺️  Campos mapeados: {len(col_map)}/{len(headers)}")
        for idx, field in sorted(col_map.items()):
            print(f"      col[{idx}] '{headers[idx]}' → '{field}'")

        unmapped = [headers[i] for i in range(len(headers)) if i not in col_map]
        if unmapped:
            print(f"  ⚠️  Não mapeados: {unmapped}")

        # construir linhas CRM
        next_id = 1
        if not dry_run:
            next_id = get_next_id(token, produto)

        crm_rows = []
        for row in data_rows:
            # pula linhas completamente vazias
            if not any(c for c in row if c is not None and str(c).strip()):
                continue

            # pula sub-headers que algumas planilhas repetem no meio
            if any(normalize(str(c)) in [normalize(h) for h in headers[:3]] for c in row[:3] if c):
                continue

            record = {field:"" for field in CRM_HEADERS}
            record["#ID"] = str(next_id).zfill(4)
            if not record.get("Data Entrada"):
                record["Data Entrada"] = datetime.now().strftime("%d/%m/%Y")

            for col_idx, field in col_map.items():
                if col_idx < len(row):
                    val = row[col_idx]
                    if val is None: continue
                    val_str = str(val).strip()
                    if not val_str or val_str.lower() in ['none','null','nan','n/a','-']: continue
                    # normalizar
                    normalizer = FIELD_NORMALIZERS.get(field)
                    if normalizer:
                        val_str = normalizer(val_str)
                    record[field] = val_str

            # pula se não tem nome E nem telefone (linha inútil)
            if not record["Nome Completo"] and not record["WhatsApp"] and not record["Email"]:
                continue

            headers_to_use = CRM_HEADERS_LEAD_FRIO if produto == "Lead Frio" else CRM_HEADERS
        crm_rows.append([record.get(h,"") for h in headers_to_use])
            next_id += 1

        print(f"  ✅ {len(crm_rows)} leads válidos para importar")

        if dry_run:
            print(f"  [DRY-RUN] Primeiros 3 registros:")
            for row in crm_rows[:3]:
                print(f"    {dict(zip(CRM_HEADERS[:6], row[:6]))}")
        else:
            imported = append_to_sheet(token, produto, crm_rows)
            print(f"  ✅ {imported} linhas importadas → aba '{produto}'")
            total_imported += imported

    print(f"\n{'='*60}")
    print(f"📊 RESULTADO: {total_imported} leads importados | {total_skipped} linhas ignoradas")
    print(f"{'='*60}")
    return total_imported

# ── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CRM Importer - Grupo US")
    parser.add_argument("arquivo",             help="Caminho do arquivo xlsx/csv")
    parser.add_argument("--produto",           help=f"Forçar produto: {', '.join(PRODUTOS)}", default=None)
    parser.add_argument("--dry-run",           help="Simular sem importar", action="store_true")
    args = parser.parse_args()

    if not os.path.exists(TOKEN_FILE):
        print(f"❌ Token não encontrado: {TOKEN_FILE}")
        print("Execute: gog auth tokens export suporte@drasacha.com.br --out /tmp/gog_token_import.json")
        sys.exit(1)

    process_file(args.arquivo, force_produto=args.produto, dry_run=args.dry_run)
