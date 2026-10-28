CREATE TABLE projects (
	id INTEGER PRIMARY KEY,
	slug TEXT NOT NULL UNIQUE,
	description TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE sources (
	id INTEGER PRIMARY KEY,
	project_id INTEGER NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
	slug TEXT NOT NULL,
	git_url TEXT NOT NULL,
	branch TEXT NOT NULL,
	path TEXT NOT NULL,
	exclusions TEXT NOT NULL DEFAULT '[]',
	username TEXT,
	token TEXT,
	last_commit TEXT,
	last_synced_at TEXT,
	error TEXT,
	warnings TEXT NOT NULL DEFAULT '[]',
	UNIQUE (project_id, slug)
) STRICT;

CREATE TABLE pages (
	id INTEGER PRIMARY KEY,
	source_id INTEGER NOT NULL REFERENCES sources (id) ON DELETE CASCADE,
	file TEXT NOT NULL,
	title TEXT NOT NULL,
	description TEXT,
	tags TEXT NOT NULL DEFAULT '[]',
	content TEXT NOT NULL,
	UNIQUE (source_id, file)
) STRICT;

-- No unique (page_id, anchor): parts of a split section share an anchor, the overview has none.
CREATE TABLE snippets (
	id INTEGER PRIMARY KEY,
	page_id INTEGER NOT NULL REFERENCES pages (id) ON DELETE CASCADE,
	position INTEGER NOT NULL,
	anchor TEXT,
	aliases TEXT NOT NULL DEFAULT '[]',
	title_path TEXT NOT NULL,
	content TEXT NOT NULL,
	tokens INTEGER NOT NULL,
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

CREATE TABLE api_keys (
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL,
	key_hash TEXT NOT NULL UNIQUE,
	all_projects INTEGER NOT NULL CHECK (all_projects IN (0, 1)),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

CREATE TABLE api_key_projects (
	api_key_id INTEGER NOT NULL REFERENCES api_keys (id) ON DELETE CASCADE,
	project_id INTEGER NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
	PRIMARY KEY (api_key_id, project_id)
) STRICT;
