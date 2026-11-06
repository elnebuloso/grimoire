-- What kind of failure a sync error is, decided where it happened, so the admin area does not
-- have to guess it from the English message. Errors stored before have none; they are classified
-- by their text.
ALTER TABLE sources ADD COLUMN error_kind TEXT;
ALTER TABLE sync_runs ADD COLUMN error_kind TEXT;
