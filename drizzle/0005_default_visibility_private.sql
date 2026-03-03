-- Flip all existing public tasks to private so each user only sees their own
UPDATE tasks SET visibility = 'private' WHERE visibility = 'public';
