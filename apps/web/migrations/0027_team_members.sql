CREATE TABLE team_members (
  id           TEXT PRIMARY KEY,
  owner_id     TEXT NOT NULL,
  name         TEXT NOT NULL,
  username     TEXT NOT NULL,
  display_name TEXT,
  description  TEXT,
  bio          TEXT,
  soul         TEXT,
  role         TEXT,
  capabilities TEXT,
  handoff_to   TEXT,
  skills       TEXT,
  md_path      TEXT,
  builtin      INTEGER NOT NULL DEFAULT 0,
  version      TEXT NOT NULL DEFAULT 'latest',
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_team_members_owner ON team_members(owner_id);
CREATE UNIQUE INDEX idx_team_members_owner_username_version ON team_members(owner_id, username, version);
