#!/bin/bash
# UDS Self-Healing Health Check
# Runs daily at 9 AM via cron
# Checks all containers, endpoints, and auto-restarts on failure

set -euo pipefail

UDS_DIR="/home/mauricio/universal-data-system"
LOG_FILE="/home/mauricio/universal-data-system/logs/healthcheck.log"
COMPOSE="docker compose -f $UDS_DIR/docker-compose.yml"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Rotate log (keep last 500 lines)
if [ -f "$LOG_FILE" ]; then
  tail -500 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

log "========== UDS Health Check Started =========="

ISSUES=0
FIXED=0

# 1. Check if containers are running
check_container() {
  local name=$1
  local status
  status=$(docker inspect -f '{{.State.Status}}' "$name" 2>/dev/null || echo "missing")

  if [ "$status" != "running" ]; then
    log "❌ Container $name is $status — restarting..."
    ISSUES=$((ISSUES + 1))
    cd "$UDS_DIR" && $COMPOSE up -d "$2" 2>&1 | tee -a "$LOG_FILE"
    sleep 5
    status=$(docker inspect -f '{{.State.Status}}' "$name" 2>/dev/null || echo "missing")
    if [ "$status" = "running" ]; then
      log "✅ Container $name recovered"
      FIXED=$((FIXED + 1))
    else
      log "🔴 Container $name STILL DOWN after restart"
    fi
  else
    log "✅ Container $name is running"
  fi
}

check_container "uds-postgres" "postgres"
check_container "uds-redis" "redis"
check_container "uds-api" "api"
check_container "uds-worker" "worker"

# 2. Check API health endpoint
sleep 2
API_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://localhost:8000/health 2>/dev/null || echo "000")

if [ "$API_STATUS" != "200" ]; then
  log "❌ API health returned $API_STATUS — restarting API..."
  ISSUES=$((ISSUES + 1))
  cd "$UDS_DIR" && $COMPOSE restart api 2>&1 | tee -a "$LOG_FILE"
  sleep 10
  API_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://localhost:8000/health 2>/dev/null || echo "000")
  if [ "$API_STATUS" = "200" ]; then
    log "✅ API recovered after restart"
    FIXED=$((FIXED + 1))
  else
    log "🔴 API STILL UNHEALTHY — attempting full rebuild..."
    cd "$UDS_DIR" && $COMPOSE up -d --build api 2>&1 | tee -a "$LOG_FILE"
    sleep 15
    API_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://localhost:8000/health 2>/dev/null || echo "000")
    if [ "$API_STATUS" = "200" ]; then
      log "✅ API recovered after rebuild"
      FIXED=$((FIXED + 1))
    else
      log "🔴 API CRITICAL FAILURE — needs manual intervention"
    fi
  fi
else
  log "✅ API health endpoint OK (200)"
fi

# 3. Check PostgreSQL connectivity
PG_OK=$(docker exec uds-postgres pg_isready -U postgres 2>/dev/null && echo "yes" || echo "no")
if [ "$PG_OK" = "no" ]; then
  log "❌ PostgreSQL not accepting connections — restarting..."
  ISSUES=$((ISSUES + 1))
  cd "$UDS_DIR" && $COMPOSE restart postgres 2>&1 | tee -a "$LOG_FILE"
  sleep 10
  PG_OK=$(docker exec uds-postgres pg_isready -U postgres 2>/dev/null && echo "yes" || echo "no")
  if [ "$PG_OK" = "yes" ]; then
    log "✅ PostgreSQL recovered"
    FIXED=$((FIXED + 1))
  fi
else
  log "✅ PostgreSQL accepting connections"
fi

# 4. Check Redis connectivity
REDIS_OK=$(docker exec uds-redis redis-cli ping 2>/dev/null || echo "FAIL")
if [ "$REDIS_OK" != "PONG" ]; then
  log "❌ Redis not responding — restarting..."
  ISSUES=$((ISSUES + 1))
  cd "$UDS_DIR" && $COMPOSE restart redis 2>&1 | tee -a "$LOG_FILE"
  sleep 5
  REDIS_OK=$(docker exec uds-redis redis-cli ping 2>/dev/null || echo "FAIL")
  if [ "$REDIS_OK" = "PONG" ]; then
    log "✅ Redis recovered"
    FIXED=$((FIXED + 1))
  fi
else
  log "✅ Redis responding (PONG)"
fi

# 5. Check disk space (warn if <10% free)
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 90 ]; then
  log "⚠️ Disk usage at ${DISK_USAGE}% — cleaning Docker..."
  ISSUES=$((ISSUES + 1))
  docker system prune -f --volumes 2>&1 | tee -a "$LOG_FILE"
  FIXED=$((FIXED + 1))
else
  log "✅ Disk usage: ${DISK_USAGE}%"
fi

# 6. Check search endpoint (functional test)
SEARCH_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 -X POST http://localhost:8000/search \
  -H 'Content-Type: application/json' \
  -d '{"query": "test", "top_k": 1}' 2>/dev/null || echo "000")

if [ "$SEARCH_STATUS" != "200" ]; then
  log "⚠️ Search endpoint returned $SEARCH_STATUS (may need BM25 index rebuild)"
  ISSUES=$((ISSUES + 1))
else
  log "✅ Search endpoint functional (200)"
fi

# Summary
log "========== Health Check Complete =========="
log "Issues found: $ISSUES | Fixed: $FIXED"

if [ "$ISSUES" -gt 0 ] && [ "$ISSUES" -ne "$FIXED" ]; then
  log "🔴 UNRESOLVED ISSUES: $((ISSUES - FIXED))"
  exit 1
fi

exit 0
