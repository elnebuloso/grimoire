-- Cron expression with five fields; NULL means the global default (SYNC_SCHEDULE).
ALTER TABLE sources ADD COLUMN sync_schedule TEXT;
ALTER TABLE sources ADD COLUMN last_checked_at TEXT;
