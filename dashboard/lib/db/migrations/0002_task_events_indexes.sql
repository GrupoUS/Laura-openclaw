-- dashboard/lib/db/migrations/0002_task_events_indexes.sql
-- Índice para feed de atividade ordenado por tempo (evita full table scan)
CREATE INDEX IF NOT EXISTS idx_task_events_created_at
  ON task_events (created_at DESC);

-- Índice para busca de atividade por agente
CREATE INDEX IF NOT EXISTS idx_task_events_agent
  ON task_events (agent, created_at DESC);

-- Índice para busca de atividade por task
CREATE INDEX IF NOT EXISTS idx_task_events_task_id
  ON task_events (task_id, created_at DESC);
