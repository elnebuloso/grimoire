-- The name people read; the slug stays the address agents use. Existing rows start with their slug.
ALTER TABLE projects ADD COLUMN name TEXT NOT NULL DEFAULT '';
ALTER TABLE sources ADD COLUMN name TEXT NOT NULL DEFAULT '';
UPDATE projects SET name = slug;
UPDATE sources SET name = slug;
