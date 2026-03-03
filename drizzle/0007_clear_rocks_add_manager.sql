-- Clear all legacy rocks data
DELETE FROM rocks;

-- Add manager_id to users for org hierarchy (direct reports)
ALTER TABLE users ADD COLUMN manager_id TEXT REFERENCES users(id) ON DELETE SET NULL;
