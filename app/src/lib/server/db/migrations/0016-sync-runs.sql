-- The recent sync runs of each source, to tell since when it fails or when its commit last moved.
-- Repeats of the latest entry (unchanged at the same commit, or failing with the same error) are
-- counted in it instead of adding rows: polling every few minutes would otherwise push out all
-- history within hours.
CREATE TABLE sync_runs (
	id INTEGER PRIMARY KEY,
	source_id INTEGER NOT NULL REFERENCES sources (id) ON DELETE CASCADE,
	-- When the first of the counted runs started and the last one finished.
	started_at TEXT NOT NULL,
	finished_at TEXT NOT NULL,
	outcome TEXT NOT NULL CHECK (outcome IN ('unchanged', 'synced', 'failed')),
	commit_hash TEXT,
	error TEXT,
	runs INTEGER NOT NULL DEFAULT 1
) STRICT;
CREATE INDEX sync_runs_source ON sync_runs (source_id, id);
