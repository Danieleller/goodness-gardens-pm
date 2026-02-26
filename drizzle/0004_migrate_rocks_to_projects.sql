-- Migrate existing rocks data into projects table
INSERT INTO projects (id, title, owner_user_id, quarter, rock_number, status, progress, notes, type, visibility, created_at, updated_at)
SELECT id, title, owner_user_id, quarter, rock_number, status, progress, notes, 'rock', 'members', created_at, updated_at
FROM rocks;
--> statement-breakpoint
-- Add rock owners as project members with 'owner' role
INSERT INTO project_members (id, project_id, user_id, role, added_at)
SELECT lower(hex(randomblob(16))), r.id, r.owner_user_id, 'owner', r.created_at
FROM rocks r
WHERE r.owner_user_id IS NOT NULL;
