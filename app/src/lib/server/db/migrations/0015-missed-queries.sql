-- Agent queries that found nothing: what the documentation is missing, or words it does not use.
-- The project is kept as the slug that was asked for, like a log line, so it outlives a rename.
CREATE TABLE missed_queries (
	id INTEGER PRIMARY KEY,
	question TEXT NOT NULL,
	-- NULL for a query across all projects.
	project TEXT,
	asked_at TEXT NOT NULL
) STRICT;
CREATE INDEX missed_queries_asked_at ON missed_queries (asked_at);
