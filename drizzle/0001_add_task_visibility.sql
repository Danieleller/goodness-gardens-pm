-- Add visibility + project_id columns to tasks
ALTER TABLE tasks ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public';
ALTER TABLE tasks ADD COLUMN project_id TEXT;
