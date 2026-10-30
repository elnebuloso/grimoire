import { posix } from 'node:path';
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import { estimateTokens } from '../parsing/chunk';
import { redactUrl } from '../sync/git';
import type { SourceScope } from '../api-keys';
import { grimoireId, withSlug, type SectionLocation } from '../grimoire-id';

export interface SearchOptions {
	query: string;
	/** Slugs of the sources to search; all sources when undefined. */
	sources?: string[];
	/** The sources the caller may see. */
	allowedSources: SourceScope;
	tokens?: number;
}

/** A snippet with everything needed to render it on its own. */
export interface SnippetHit {
	source: string;
	gitUrl: string;
	branch: string;
	path: string;
	file: string;
	anchor: string | null;
	titlePath: string[];
	content: string;
	/** Estimated when the page was indexed. */
	tokens: number;
}

/**
 * A database row with the columns of `SnippetHit` as stored: the title path as JSON, without the
 * source and without the part label, links in the content without the source either.
 */
interface SnippetRow extends Omit<SnippetHit, 'titlePath'> {
	title_path: string;
	part: number;
	parts: number;
}

/** Matches the rows of `sources` in a scope, bound as `:scope` with `scopeParameter`. */
export const IN_SCOPE = `(:scope IS NULL OR sources.public = 1
	OR sources.slug IN (SELECT value FROM json_each(:scope)))`;

export function scopeParameter(scope: SourceScope): string | null {
	if (scope === 'all') return null;
	return JSON.stringify(scope === 'public' ? [] : scope);
}

interface SnippetQuery {
	/** Further tables joined to `snippets`. */
	join?: string;
	where: string;
	orderBy: string;
	limit?: number;
}

/**
 * The snippets in scope that match `query`, ready to render. Its clauses may use `snippets`,
 * `pages` and `sources`, and the named parameters given in `parameters`.
 */
export function selectSnippets(
	db: DatabaseSync,
	query: SnippetQuery,
	parameters: Record<string, SQLInputValue>,
	scope: SourceScope
): SnippetHit[] {
	const rows = db
		.prepare(
			`SELECT sources.slug AS source, sources.git_url AS gitUrl,
				sources.branch, sources.path, pages.file, snippets.anchor, snippets.title_path,
				snippets.part, snippets.parts, snippets.content, snippets.tokens
			FROM snippets
			${query.join ?? ''}
			JOIN live_pages AS pages ON pages.id = snippets.page_id
			JOIN sources ON sources.id = pages.source_id
			WHERE (${query.where}) AND ${IN_SCOPE}
			ORDER BY ${query.orderBy}
			${query.limit === undefined ? '' : `LIMIT ${query.limit}`}`
		)
		.all({ ...parameters, scope: scopeParameter(scope) }) as unknown as SnippetRow[];
	return rows.map(toSnippetHit);
}

/** The snippets of a page or one section, in page order; empty for an unknown page or section. */
export function readSnippets(
	db: DatabaseSync,
	location: SectionLocation,
	scope: SourceScope
): SnippetHit[] {
	// An empty anchor names no section, so `?section=` and an ID ending in `#` read the page.
	const anchor = location.anchor || null;
	return selectSnippets(
		db,
		{
			where: `sources.slug = :source AND pages.file = :file
				AND (:anchor IS NULL OR snippets.anchor = :anchor
					OR :anchor IN (SELECT value FROM json_each(snippets.aliases)))`,
			orderBy: 'snippets.position'
		},
		{ source: location.source, file: location.file, anchor },
		scope
	);
}

export const DEFAULT_TOKENS = 3000;

/** A token budget as a query string sends it: a positive whole number, otherwise undefined. */
export function parseTokenBudget(value: string): number | undefined {
	return /^[1-9]\d*$/.test(value) ? Number(value) : undefined;
}
// Caps the list of hits that did not fit; beyond this the agent should rephrase, not read on.
const MAX_HITS = 20;

/**
 * Full-text search over all snippets, ranked by BM25 with the title path weighted above the
 * text and the text above code. Returns the rendered hits in ranking order, as many as fit into
 * the token budget, followed by a line naming the IDs of hits that did not fit.
 */
export function searchSnippets(db: DatabaseSync, options: SearchOptions): string {
	const match = toMatchExpression(options.query);
	if (!match) return '';

	// bm25 weighs the columns title_path, text and code. Internal docs are full of names a title
	// carries and commands code repeats, hence 10 / 1 / 0.25. Checked with typical questions
	// against a large real documentation set: equal weights rank the right section first far less
	// often; anything from 3 to 20 for the title ranks about as well.
	const hits = selectSnippets(
		db,
		{
			join: 'JOIN snippets_fts ON snippets_fts.rowid = snippets.id',
			where: `snippets_fts MATCH :match
				AND (:sources IS NULL OR sources.slug IN (SELECT value FROM json_each(:sources)))`,
			orderBy: 'bm25(snippets_fts, 10, 1, 0.25)',
			limit: MAX_HITS
		},
		{ match, sources: options.sources ? JSON.stringify(options.sources) : null },
		options.allowedSources
	);

	return packIntoBudget(hits, options.tokens ?? DEFAULT_TOKENS);
}

function toSnippetHit({ title_path, part, parts, ...row }: SnippetRow): SnippetHit {
	const titlePath = JSON.parse(title_path) as string[];
	if (parts > 1) titlePath.push(`${titlePath.pop()} (${part}/${parts})`);
	return {
		...row,
		titlePath: [row.source, ...titlePath],
		content: withSlug(row.content, row.source)
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
