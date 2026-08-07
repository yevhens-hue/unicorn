-- Alfred Household Chief of Staff - PostgreSQL Schema DDL
-- Specification: alfred-household-cos-spec.md (§2)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Raw Messages Audit & Replay Log
CREATE TABLE IF NOT EXISTS raw_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel      TEXT NOT NULL CHECK (channel IN ('telegram', 'sms', 'todoist', 'email', 'voice')),
  sender       TEXT NOT NULL,              -- 'connor' | 'wife' | raw handle/email
  body         TEXT NOT NULL,
  source_ref   TEXT,                       -- Telegram message_id, Email message-id, etc.
  received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed    BOOLEAN NOT NULL DEFAULT FALSE,
  task_id      UUID                        -- FK to tasks once extracted
);

-- 2. Master Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  raw_input           TEXT,                       -- Original phrasing
  category            TEXT NOT NULL CHECK (category IN ('bill', 'repair', 'appointment', 'errand', 'respond', 'other')),
  priority            SMALLINT NOT NULL DEFAULT 2 CHECK (priority IN (1, 2, 3)), -- 1 urgent, 2 this week, 3 whenever
  status              TEXT NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox', 'active', 'waiting_on', 'done', 'cancelled')),
  owner               TEXT CHECK (owner IN ('connor', 'wife', 'delegate')),
  requested_by        TEXT CHECK (requested_by IN ('connor', 'wife')),
  due_date            DATE,                       -- Action date
  deadline            DATE,                       -- Hard cutoff date
  amount_cents        INTEGER,                    -- Bills amount in cents (e.g. 31200 = $312.00)
  vendor              TEXT,
  source_document_url TEXT,                 -- Stored original PDF/photo URL for approval review
  needs_approval      BOOLEAN NOT NULL DEFAULT FALSE,
  source              TEXT NOT NULL,              -- Intake channel
  follow_up_at        TIMESTAMPTZ,                -- Resurfacing timestamp for waiting_on
  todoist_task_id     TEXT UNIQUE,                -- External Todoist ID mapping
  todoist_project_id  TEXT,                       -- Todoist project mapping
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);

-- Foreign key link back to tasks
ALTER TABLE raw_messages 
  DROP CONSTRAINT IF EXISTS fk_raw_messages_task;
ALTER TABLE raw_messages 
  ADD CONSTRAINT fk_raw_messages_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

-- 3. Task Immutable Audit Events Log
CREATE TABLE IF NOT EXISTS task_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN ('created', 'confirmed', 'status_change', 'approval_requested', 'approved', 'done', 'followup_sent')),
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performant lookup & scheduling queries
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_needs_approval ON tasks(needs_approval) WHERE needs_approval IS TRUE;
CREATE INDEX IF NOT EXISTS idx_tasks_todoist_id ON tasks(todoist_task_id) WHERE todoist_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_follow_up ON tasks(follow_up_at) WHERE status = 'waiting_on';
CREATE INDEX IF NOT EXISTS idx_raw_messages_unprocessed ON raw_messages(processed) WHERE processed IS FALSE;
