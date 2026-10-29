-- 1 while the admin has paused the source: polling skips it, "sync now" still syncs it.
ALTER TABLE sources ADD COLUMN paused INTEGER NOT NULL DEFAULT 0 CHECK (paused IN (0, 1));
