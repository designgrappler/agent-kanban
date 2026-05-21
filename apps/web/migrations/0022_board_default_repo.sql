ALTER TABLE boards ADD COLUMN default_repository_id TEXT REFERENCES repositories(id);
