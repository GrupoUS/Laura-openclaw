-- Tabela principal de tarefas
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT DEFAULT 'backlog',   -- backlog | in_progress | done | blocked
  phase       INT  DEFAULT 1,
  priority    TEXT DEFAULT 'medium',    -- low | medium | high | critical
  agent       TEXT,                     -- qual agente é o owner
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Subtarefas atômicas (atomic tasks)
CREATE TABLE subtasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  status      TEXT DEFAULT 'todo',      -- todo | doing | done
  phase       INT DEFAULT 1,
  agent       TEXT,                     -- agente responsável
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Log de eventos (para feed de atividade)
CREATE TABLE task_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID REFERENCES tasks(id) ON DELETE CASCADE,
  agent      TEXT,
  event_type TEXT,  -- created | status_changed | subtask_done | comment
  payload    JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
