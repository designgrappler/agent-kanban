CREATE TABLE backlog_items (
  id                    TEXT PRIMARY KEY,
  board_id              TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  description           TEXT,
  priority              TEXT NOT NULL CHECK(priority IN ('P0', 'P1', 'P2', 'P3')),
  status                TEXT NOT NULL DEFAULT 'idea' CHECK(status IN ('idea', 'in_planning', 'consumed', 'dropped')),
  created_by            TEXT NOT NULL,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now')),
  consumed_at           TEXT,
  consumed_into_task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL
);
CREATE INDEX idx_backlog_items_board ON backlog_items(board_id);
CREATE INDEX idx_backlog_items_board_status ON backlog_items(board_id, status);
