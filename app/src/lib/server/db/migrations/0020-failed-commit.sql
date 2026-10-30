-- The commit whose indexing failed, so it is not indexed again on every check until it changes.
ALTER TABLE sources ADD COLUMN failed_commit TEXT;
