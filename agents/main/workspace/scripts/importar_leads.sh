#!/bin/bash
# Importar leads para o CRM - Grupo US
# Uso: ./importar_leads.sh arquivo.xlsx [--produto TRINTAE3] [--dry-run]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOKEN_FILE="/tmp/gog_token_import.json"

echo "🔑 Preparando credenciais..."
gog auth tokens export suporte@drasacha.com.br --out "$TOKEN_FILE" --force 2>/dev/null || \
gog auth tokens export suporte@drasacha.com.br --out "$TOKEN_FILE" 2>/dev/null

if [ ! -f "$TOKEN_FILE" ]; then
    echo "❌ Falha ao exportar token. Verifique autenticação do gog."
    exit 1
fi

echo "🚀 Iniciando importação..."
python3 "$SCRIPT_DIR/crm_importer.py" "$@"

echo "🗑️ Limpando token temporário..."
rm -f "$TOKEN_FILE"

echo "✅ Concluído!"
