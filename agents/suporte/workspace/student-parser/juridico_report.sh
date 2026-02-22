#!/bin/bash
# =============================================================================
# Relatório Diário de Cobrança — Grupo Jurídico
# Horário: 10h, Segunda a Sexta
#
# ⚠️ PENDENTE: Substituir GRUPO_JURIDICO_ID pelo ID real do grupo
#
# Após configurar, instalar no cron:
#   crontab -e
#   0 10 * * 1-5 /Users/mauricio/.openclaw/agents/suporte/workspace/student-parser/juridico_report.sh
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/juridico_$(date +%Y%m%d).log"

mkdir -p "$LOG_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Gerando relatório jurídico..." | tee "$LOG_FILE"

NEON_DATABASE_URL="postgresql://neondb_owner:npg_P0ljy3pWNTYc@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" \
GRUPO_JURIDICO="120363285625757349@g.us" \
  node "$SCRIPT_DIR/juridico_report.mjs" >> "$LOG_FILE" 2>&1

EXIT_CODE=$?
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Concluído (código: $EXIT_CODE)" | tee -a "$LOG_FILE"
exit $EXIT_CODE
