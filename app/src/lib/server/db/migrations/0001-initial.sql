-- Sources are state that exists nowhere else. Pages, snippets, links and the search index are
-- derived from Git and rebuilt by every sync of a source.

-- The name and description are for people and agents choosing what to search; the slug is the
-- address agents use, the first part of every ID.
CREATE TABLE sources (
	id INTEGER PRIMARY KEY,
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
	-- Encrypted by the application with TOKEN_ENCRYPTION_KEY.
	encrypted_token TEXT,
	-- Where the documentation of the source is published as a site, for people; NULL when not given.
	docs_url TEXT,
	-- Cron expression with five fields; NULL means the global default (SYNC_SCHEDULE).
	sync_schedule TEXT,
	-- 1 when anyone may read the source without an API key; a new source is private.
	public INTEGER NOT NULL DEFAULT 0 CHECK (public IN (0, 1)),
	-- 1 while the admin has paused the source: polling skips it, "sync now" still syncs it.
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
	warnings TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(warnings))
) STRICT;

CREATE TABLE pages (
	id INTEGER PRIMARY KEY,
	source_id INTEGER NOT NULL REFERENCES sources (id) ON DELETE CASCADE,
	generation INTEGER NOT NULL DEFAULT 0,
	file TEXT NOT NULL,
	title TEXT NOT NULL,
	description TEXT,
	tags TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags)),
	content TEXT NOT NULL,
	-- Index of the page in the site's `nav`; NULL when the page is not listed there.
	nav_position INTEGER,
	UNIQUE (source_id, generation, file)
) STRICT;

-- Readers go through this view, which hides pages of every other generation: one being written,
-- or one left behind until it is deleted.
CREATE VIEW live_pages AS
	SELECT pages.* FROM pages
	JOIN sources ON sources.id = pages.source_id AND sources.index_generation = pages.generation;

-- No unique (page_id, anchor): parts of a split section share an anchor, the overview has none.
-- Title paths and links between pages hold IDs relative to the source; the source slug is added
-- when the index is read, so a changed slug takes effect at once.
CREATE TABLE snippets (
	id INTEGER PRIMARY KEY,
	page_id INTEGER NOT NULL REFERENCES pages (id) ON DELETE CASCADE,
	position INTEGER NOT NULL,
	anchor TEXT,
	aliases TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(aliases)),
	title_path TEXT NOT NULL CHECK (json_valid(title_path)),
	content TEXT NOT NULL,
	tokens INTEGER NOT NULL,
	-- A section split into several snippets: which part of how many. The label is added only
	-- where a snippet is rendered.
	part INTEGER NOT NULL DEFAULT 1,
	parts INTEGER NOT NULL DEFAULT 1,
	UNIQUE (page_id, position)
) STRICT;

CREATE VIRTUAL TABLE snippets_fts USING fts5 (title_path, text, code);

-- Foreign key cascades do not reach virtual tables.
CREATE TRIGGER snippets_fts_delete AFTER DELETE ON snippets BEGIN
	DELETE FROM snippets_fts WHERE rowid = old.id;
END;

CREATE TABLE links (
	id INTEGER PRIMARY KEY,
	page_id INTEGER NOT NULL REFERENCES pages (id) ON DELETE CASCADE,
	anchor TEXT,
	target TEXT NOT NULL,
	dead INTEGER NOT NULL CHECK (dead IN (0, 1))
) STRICT;

CREATE INDEX links_target ON links (target);
-- Deleting an old generation page by page would otherwise scan every link for each page.
CREATE INDEX links_page ON links (page_id);

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

CREATE TABLE api_keys (
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL CHECK (trim(name) <> ''),
	key_hash TEXT NOT NULL UNIQUE,
	all_sources INTEGER NOT NULL CHECK (all_sources IN (0, 1)),
	-- ISO 8601 in UTC with `Z`, like every timestamp the application writes.
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	-- When the key last authenticated a request, so unused keys can be found and revoked. Written
	-- at most once a minute per key, not on every request.
	last_used_at TEXT,
	-- The last calendar day, in the time zone of the instance, on which the key is accepted; NULL
	-- for a key that does not expire.
	valid_until TEXT CHECK (valid_until GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
) STRICT;

CREATE TABLE api_key_sources (
	api_key_id INTEGER NOT NULL REFERENCES api_keys (id) ON DELETE CASCADE,
	source_id INTEGER NOT NULL REFERENCES sources (id) ON DELETE CASCADE,
	PRIMARY KEY (api_key_id, source_id)
) STRICT;

-- A key opens all sources or the ones listed here, never both: selected sources next to
-- `all_sources = 1` would leave open which of the two applies.
CREATE TRIGGER api_key_sources_only_for_selections BEFORE INSERT ON api_key_sources
WHEN (SELECT all_sources FROM api_keys WHERE id = NEW.api_key_id) = 1 BEGIN
	SELECT RAISE(ABORT, 'a key for all sources has no selected sources');
END;

CREATE TRIGGER api_keys_all_sources_without_selection BEFORE UPDATE OF all_sources ON api_keys
WHEN NEW.all_sources = 1 AND EXISTS (SELECT 1 FROM api_key_sources WHERE api_key_id = NEW.id) BEGIN
	SELECT RAISE(ABORT, 'a key for all sources has no selected sources');
END;

-- Accounts, any number of them; what a user may do follows from their roles. Users log in with
-- their email address, which a password reset by mail needs anyway. Addresses are stored in
-- lowercase, so the UNIQUE constraint holds regardless of letter case.
CREATE TABLE users (
	id INTEGER PRIMARY KEY,
	email TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
	password_hash TEXT NOT NULL
) STRICT;

-- One row per user and role. The roles that exist are the ones the code knows; a new role widens
-- this check.
CREATE TABLE user_roles (
	user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	role TEXT NOT NULL CHECK (role IN ('admin')),
	PRIMARY KEY (user_id, role)
) STRICT;

CREATE TABLE sessions (
	token_hash TEXT PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	expires_at TEXT NOT NULL
) STRICT;
CREATE INDEX sessions_user ON sessions (user_id);

-- Links that set a new password, sent by mail. Only a hash of the token is stored, like the
-- session tokens: whoever reads the database cannot use the links.
CREATE TABLE password_resets (
	token_hash TEXT PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	expires_at TEXT NOT NULL
) STRICT;
CREATE INDEX password_resets_user ON password_resets (user_id);

-- Agent queries that found nothing: what the documentation is missing, or words it does not use.
-- The sources are kept as the slugs that were asked for, like a log line, so they outlive a rename.
CREATE TABLE missed_queries (
	id INTEGER PRIMARY KEY,
	question TEXT NOT NULL,
	-- The slugs as a sorted JSON array; NULL for a query across all sources.
	sources TEXT CHECK (json_valid(sources)),
	asked_at TEXT NOT NULL
) STRICT;
CREATE INDEX missed_queries_asked_at ON missed_queries (asked_at);

-- Settings of the whole instance: one row, one typed column per setting.
CREATE TABLE settings (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	-- 1 while the admin has paused all syncs: polling checks no source, "sync now" still syncs.
	syncs_paused INTEGER NOT NULL DEFAULT 0 CHECK (syncs_paused IN (0, 1))
) STRICT;
INSERT INTO settings (id) VALUES (1);
