-- A section split into several snippets kept its part label in the title, as `Title (1/2)`, and
-- the index stripped it again by pattern, which also cut real headings ending like that. The part
-- moves into its own columns; the label is added only where a snippet is rendered. The parts of
-- one section share its anchor, the overview's parts a NULL one.
ALTER TABLE snippets ADD COLUMN part INTEGER NOT NULL DEFAULT 1;
ALTER TABLE snippets ADD COLUMN parts INTEGER NOT NULL DEFAULT 1;

CREATE TEMP TABLE snippet_parts AS
	SELECT id,
		row_number() OVER (PARTITION BY page_id, anchor ORDER BY position) AS part,
		count(*) OVER (PARTITION BY page_id, anchor) AS parts
	FROM snippets;
DELETE FROM snippet_parts WHERE parts = 1;
ALTER TABLE snippet_parts ADD COLUMN label TEXT;
UPDATE snippet_parts SET label = ' (' || part || '/' || parts || ')';

UPDATE snippets SET
	part = snippet_parts.part,
	parts = snippet_parts.parts,
	title_path = json_set(title_path, '$[#-1]',
		substr(title_path ->> '$[#-1]', 1, length(title_path ->> '$[#-1]') - length(label)))
FROM snippet_parts
WHERE snippet_parts.id = snippets.id
	AND substr(title_path ->> '$[#-1]', -length(label)) = label;

UPDATE snippets_fts SET title_path = substr(snippets_fts.title_path, 1,
	length(snippets_fts.title_path) - length(label))
FROM snippet_parts
WHERE snippet_parts.id = snippets_fts.rowid
	AND substr(snippets_fts.title_path, -length(label)) = label;

DROP TABLE snippet_parts;
