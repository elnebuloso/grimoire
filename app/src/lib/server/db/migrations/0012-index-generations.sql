-- A sync writes the new index of a source in short transactions under the next generation and
-- switches to it by updating the source, so it never holds the write lock for long and readers
-- see either the old index or the new one. Readers go through `live_pages`, which hides pages of
-- every other generation: one being written, or one left behind until it is deleted.
ALTER TABLE sources ADD COLUMN index_generation INTEGER NOT NULL DEFAULT 0;

CREATE TABLE pages_new (
	id INTEGER PRIMARY KEY,
	source_id INTEGER NOT NULL REFERENCES sources (id) ON DELETE CASCADE,
	generation INTEGER NOT NULL DEFAULT 0,
	file TEXT NOT NULL,
	title TEXT NOT NULL,
	description TEXT,
	tags TEXT NOT NULL DEFAULT '[]',
	content TEXT NOT NULL,
	nav_position INTEGER,
	UNIQUE (source_id, generation, file)
) STRICT;

INSERT INTO pages_new (id, source_id, file, title, description, tags, content, nav_position)
	SELECT id, source_id, file, title, description, tags, content, nav_position FROM pages;
DROP TABLE pages;
ALTER TABLE pages_new RENAME TO pages;

-- Deleting an old generation page by page would otherwise scan every link for each page.
CREATE INDEX links_page ON links (page_id);

CREATE VIEW live_pages AS
	SELECT pages.* FROM pages
	JOIN sources ON sources.id = pages.source_id AND sources.index_generation = pages.generation;
