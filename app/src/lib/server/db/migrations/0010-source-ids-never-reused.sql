-- Without AUTOINCREMENT SQLite hands the id of the newest deleted source to the next one, and a
-- sync of the deleted source still waiting in the queue would write into the new one. SQLite
-- cannot add AUTOINCREMENT in place: the table is built anew and takes the old name, so every
-- reference to `sources` points at it again. The view reading `sources` would stop the rename.
DROP VIEW live_pages;

CREATE TABLE sources_new (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	-- The rule of `isSlug` in the application: lowercase letters, digits and single hyphens.
	slug TEXT NOT NULL UNIQUE CHECK (
		length(slug) BETWEEN 1 AND 40
		AND slug NOT GLOB '*[^a-z0-9-]*'
		AND slug NOT GLOB '-*' AND slug NOT GLOB '*-' AND slug NOT GLOB '*--*'
	),
	name TEXT NOT NULL CHECK (trim(name) <> ''),
	description TEXT NOT NULL DEFAULT '',
	git_url TEXT NOT NULL,
	branch TEXT NOT NULL,
	path TEXT NOT NULL,
	exclusions TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(exclusions)),
	username TEXT,
	-- Encrypted by the application with a key derived from ENCRYPTION_KEY.
	encrypted_token TEXT,
	-- Where the documentation of the source is published as a site, for people; NULL when not given.
	docs_url TEXT,
	-- Cron expression with five fields; NULL means the global default (SYNC_SCHEDULE).
	sync_schedule TEXT,
	-- 1 while the scheduled syncs of the source are paused.
	paused INTEGER NOT NULL DEFAULT 0 CHECK (paused IN (0, 1)),
	last_checked_at TEXT,
	-- The commit and time the live index is from; NULL while the source has no index.
	last_commit TEXT,
	last_synced_at TEXT,
	-- The generation of pages that is live; see `live_pages`.
	index_generation INTEGER NOT NULL DEFAULT 0,
	error TEXT,
	-- The commit whose indexing failed, so it is not indexed again on every check until it changes.
	failed_commit TEXT,
	warnings TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(warnings)),
	visibility TEXT NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'public')),
	error_kind TEXT
) STRICT;
INSERT INTO sources_new (id, slug, name, description, git_url, branch, path, exclusions, username,
	encrypted_token, docs_url, sync_schedule, paused, last_checked_at, last_commit, last_synced_at,
	index_generation, error, failed_commit, warnings, visibility, error_kind)
SELECT id, slug, name, description, git_url, branch, path, exclusions, username, encrypted_token,
	docs_url, sync_schedule, paused, last_checked_at, last_commit, last_synced_at, index_generation,
	error, failed_commit, warnings, visibility, error_kind
FROM sources;
DROP TABLE sources;
ALTER TABLE sources_new RENAME TO sources;

CREATE VIEW live_pages AS
	SELECT pages.* FROM pages
	JOIN sources ON sources.id = pages.source_id AND sources.index_generation = pages.generation;
