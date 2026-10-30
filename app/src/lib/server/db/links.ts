import type { DatabaseSync } from 'node:sqlite';
import { grimoireId } from '../grimoire-id';

export interface Backlink {
	/** grimoire ID of the snippet holding the link. */
	from: string;
	/** The linked ID: the page itself or one of its anchors. */
	target: string;
	dead: boolean;
}

interface BacklinkRow {
	project: string;
	source: string;
	file: string;
	anchor: string | null;
	target: string;
	dead: number;
}

/** Returns every link pointing to the page `pageId` (`project/source/file`) or to one of its anchors. */
export function findBacklinks(db: DatabaseSync, pageId: string): Backlink[] {
	const rows = db
		.prepare(
			`SELECT projects.slug AS project, sources.slug AS source, pages.file, links.anchor,
				links.target, links.dead
			FROM links
			JOIN pages ON pages.id = links.page_id
			JOIN sources ON sources.id = pages.source_id
			JOIN projects ON projects.id = sources.project_id
			WHERE links.target = :id OR substr(links.target, 1, length(:id) + 1) = :id || '#'
			ORDER BY projects.slug, sources.slug, pages.file, links.anchor`
		)
		.all({ id: pageId }) as unknown as BacklinkRow[];

	return rows.map((row) => {
		return {
			from: grimoireId(row, row.anchor),
			target: row.target,
			dead: row.dead === 1
		};
	});
}
