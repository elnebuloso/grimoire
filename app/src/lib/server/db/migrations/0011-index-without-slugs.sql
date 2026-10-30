-- The index stores IDs relative to their source and adds project and source slugs when it is
-- read, so a changed slug takes effect at once instead of after the next sync. Title paths lose
-- their leading project and source, link targets their `project/source/` prefix, and links
-- between pages in snippet Markdown become `grimoire:<page>#<anchor>`.
CREATE TEMP TABLE slug_prefixes AS
	SELECT pages.id AS page_id,
		projects.slug || '/' || sources.slug || '/' AS id_prefix,
		projects.slug || ' › ' || sources.slug || ' › ' AS title_prefix
	FROM pages
	JOIN sources ON sources.id = pages.source_id
	JOIN projects ON projects.id = sources.project_id;

-- Where remark writes a link destination: `](id`, `](<id`, `]: id`, `<id>`.
UPDATE snippets SET
	title_path = json_remove(json_remove(title_path, '$[0]'), '$[0]'),
	content = replace(replace(replace(content,
		'](' || id_prefix, '](grimoire:'),
		']: ' || id_prefix, ']: grimoire:'),
		'<' || id_prefix, '<grimoire:')
FROM slug_prefixes
WHERE slug_prefixes.page_id = snippets.page_id;

UPDATE snippets_fts SET title_path = substr(snippets_fts.title_path, length(title_prefix) + 1)
FROM snippets
JOIN slug_prefixes ON slug_prefixes.page_id = snippets.page_id
WHERE snippets.id = snippets_fts.rowid
	AND substr(snippets_fts.title_path, 1, length(title_prefix)) = title_prefix;

-- A dead link that leaves the source path keeps the link as written, without the prefix.
UPDATE links SET target = substr(target, length(id_prefix) + 1)
FROM slug_prefixes
WHERE slug_prefixes.page_id = links.page_id
	AND substr(target, 1, length(id_prefix)) = id_prefix;

DROP TABLE slug_prefixes;
