#!/bin/bash
# =============================================================================
# Relatório Diário de Alunos — Grupo US
# Grupo: US - COORDENAÇÃO TRINTAE3
# Horário: 10h, Segunda a Sexta (sem sábado e domingo)
#
# Cron instalado:
#   0 10 * * 1-5 /Users/mauricio/.openclaw/agents/suporte/workspace/student-parser/daily_report.sh
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/report_$(date +%Y%m%d).log"

mkdir -p "$LOG_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Gerando relatório diário..." | tee "$LOG_FILE"

NEON_DATABASE_URL="postgresql://neondb_owner:npg_P0ljy3pWNTYc@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" \
  node "$SCRIPT_DIR/daily_report.mjs" >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Relatório enviado com sucesso!" | tee -a "$LOG_FILE"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Erro ao enviar relatório (código: $EXIT_CODE)" | tee -a "$LOG_FILE"
fi

# Limpar logs com mais de 30 dias
find "$LOG_DIR" -name "report_*.log" -mtime +30 -delete

exit $EXIT_CODE
