CREATE TABLE sprints (
  id          TEXT PRIMARY KEY,
  board_id    TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  number      INTEGER NOT NULL,
  theme       TEXT NOT NULL,
  status      TEXT NOT NULL CHECK(status IN ('planning', 'active', 'closed')),
  opened_at   TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at   TEXT,
  created_by  TEXT,
  UNIQUE(board_id, number)
);
CREATE INDEX idx_sprints_board ON sprints(board_id);
CREATE INDEX idx_sprints_status ON sprints(status);

ALTER TABLE tasks ADD COLUMN sprint_id TEXT REFERENCES sprints(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN track_number INTEGER;
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id);
CREATE UNIQUE INDEX idx_tasks_sprint_track ON tasks(sprint_id, track_number) WHERE sprint_id IS NOT NULL AND track_number IS NOT NULL;
