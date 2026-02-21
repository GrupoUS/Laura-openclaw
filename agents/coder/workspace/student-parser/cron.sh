#!/bin/bash
# =============================================================================
# Student Parser — Sync Recorrente
# Grupo US / Pós TRINTAE3
#
# Instalação do cron (rodar a cada 6h):
#   crontab -e
#   0 */6 * * * /Users/mauricio/.openclaw/agents/coder/workspace/student-parser/cron.sh
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/sync_$(date +%Y%m%d_%H%M%S).log"

mkdir -p "$LOG_DIR"

echo "========================================" | tee "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 Iniciando sync de alunos..." | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Verificar dependências
if ! command -v node &> /dev/null; then
  echo "[ERRO] Node.js não encontrado!" | tee -a "$LOG_FILE"
  exit 1
fi

# Verificar node_modules
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo "[INFO] Instalando dependências..." | tee -a "$LOG_FILE"
  cd "$SCRIPT_DIR" && bun install >> "$LOG_FILE" 2>&1
fi

# Executar o parser
cd "$SCRIPT_DIR"
NEON_DATABASE_URL="postgresql://neondb_owner:npg_P0ljy3pWNTYc@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" \
  node parser.mjs --execute >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

echo "========================================" | tee -a "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sync finalizado (código: $EXIT_CODE)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Limpar logs com mais de 30 dias
find "$LOG_DIR" -name "sync_*.log" -mtime +30 -delete

# Notificar OpenClaw (opcional)
# openclaw system event --text "Student sync concluído: $(grep -c 'renamed' $LOG_FILE) alunos atualizados" --mode now

exit $EXIT_CODE
