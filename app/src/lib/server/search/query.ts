import { posix } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { estimateTokens } from '../parsing/chunk';
import { redactUrl } from '../sync/git';
import { grimoireId, withSlugs } from '../grimoire-id';

export interface SearchOptions {
	query: string;
	/** Slug of the project to search; all projects when undefined. */
	project?: string;
	/** Slugs of the projects the caller may see; all projects when undefined. */
	allowedProjects?: string[];
	tokens?: number;
}

/** A snippet with everything needed to render it on its own. */
export interface SnippetHit {
	project: string;
	source: string;
	gitUrl: string;
	branch: string;
	path: string;
	file: string;
	anchor: string | null;
	titlePath: string[];
	content: string;
}

/**
 * A database row with the columns of `SnippetHit` as stored: the title path as JSON and without
 * project and source, links in the content without them either.
 */
export interface SnippetRow extends Omit<SnippetHit, 'titlePath'> {
	title_path: string;
}

const DEFAULT_TOKENS = 3000;
// Caps the list of hits that did not fit; beyond this the agent should rephrase, not read on.
const MAX_HITS = 20;

/**
 * Full-text search over all snippets, ranked by BM25 with the title path weighted above the
 * text and the text above code. Returns the rendered hits in ranking order, as many as fit into
 * the token budget, followed by a line naming the IDs of hits that did not fit.
 */
export function searchSnippets(db: DatabaseSync, options: SearchOptions): string {
	const match = toMatchExpression(options.query);
	if (!match || options.allowedProjects?.length === 0) return '';

	// bm25 weighs the columns title_path, text and code. Internal docs are full of names a title
	// carries and commands code repeats, hence 10 / 1 / 0.25. Checked with typical questions
	// against a large real documentation set: equal weights rank the right section first far less
	// often; anything from 3 to 20 for the title ranks about as well.
	const rows = db
		.prepare(
			`SELECT projects.slug AS project, sources.slug AS source, sources.git_url AS gitUrl,
				sources.branch, sources.path, pages.file, snippets.anchor, snippets.title_path,
				snippets.content
			FROM snippets_fts
			JOIN snippets ON snippets.id = snippets_fts.rowid
			JOIN pages ON pages.id = snippets.page_id
			JOIN sources ON sources.id = pages.source_id
			JOIN projects ON projects.id = sources.project_id
			WHERE snippets_fts MATCH :match
				AND (:project IS NULL OR projects.slug = :project)
				AND (:allowed IS NULL OR projects.slug IN (SELECT value FROM json_each(:allowed)))
			ORDER BY bm25(snippets_fts, 10, 1, 0.25)
			LIMIT ${MAX_HITS}`
		)
		.all({
			match,
			project: options.project ?? null,
			allowed: options.allowedProjects ? JSON.stringify(options.allowedProjects) : null
		}) as unknown as SnippetRow[];

	return packIntoBudget(rows.map(toSnippetHit), options.tokens ?? DEFAULT_TOKENS);
}

export function toSnippetHit({ title_path, ...row }: SnippetRow): SnippetHit {
	return {
		...row,
		titlePath: [row.project, row.source, ...(JSON.parse(title_path) as string[])],
		content: withSlugs(row.content, row.project, row.source)
	};
}

// Raw input breaks FTS5 syntax (`auth-service` reads as a column filter, `?` and `=` are errors).
// OR keeps natural-language questions matching; BM25 still ranks hits with more terms higher.
function toMatchExpression(query: string): string {
	const words = query.match(/[\p{L}\p{N}_]+/gu) ?? [];
	return words.map((word) => `"${word}"`).join(' OR ');
}

function packIntoBudget(hits: SnippetHit[], budget: number): string {
	const blocks: string[] = [];
	const skipped: string[] = [];
	let remaining = budget;
	for (const hit of hits) {
		const block = renderSnippet(hit);
		const tokens = estimateTokens(`${block}\n\n`);
		if (tokens > remaining) {
			skipped.push(grimoireId(hit, hit.anchor));
			continue;
		}
		blocks.push(block);
		remaining -= tokens;
	}
	if (skipped.length > 0) blocks.push(`Did not fit: ${skipped.join(', ')}`);
	return blocks.join('\n\n');
}

/** Renders a snippet with its title path, its grimoire ID and where to edit it. */
export function renderSnippet(hit: SnippetHit): string {
	const file = posix.join(hit.path, hit.file);
	return [
		`### ${hit.titlePath.join(' › ')}`,
		`Source: ${grimoireId(hit, hit.anchor)}`,
		`Edit: ${redactUrl(hit.gitUrl)} (${hit.branch}) ${file}`,
		'',
		hit.content.trimEnd()
	].join('\n');
}
