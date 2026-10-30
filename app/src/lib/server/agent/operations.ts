import type { DatabaseSync } from 'node:sqlite';
import type { SourceScope } from '../api-keys';
import { grimoireId, type SectionLocation } from '../grimoire-id';
import {
	IN_SCOPE,
	readSnippets,
	renderSnippet,
	scopeParameter,
	searchSnippets
} from '../search/query';
import { recordMissedQuery } from '../missed-queries';
import instructions from './instructions.md?raw';

/** How agents use grimoire; the same text for HTTP and as MCP server instructions. */
export const agentInstructions = instructions;

/** The answer of an operation; `found` is false for an unknown or hidden source or ID. */
export interface OperationResult {
	found: boolean;
	markdown: string;
}

// Pages in the site's `nav` first, in its order, then the rest by file path.
const PAGE_ORDER = 'pages.nav_position IS NULL, pages.nav_position, pages.file';

/** Lists the visible sources with their short description. */
export function listVisibleSources(db: DatabaseSync, scope: SourceScope): OperationResult {
	const rows = db
		.prepare(`SELECT slug, description FROM sources WHERE ${IN_SCOPE} ORDER BY slug`)
		.all({ scope: scopeParameter(scope) }) as { slug: string; description: string }[];
	if (rows.length === 0) return { found: true, markdown: 'No sources.' };
	const lines = rows.map((row) =>
		row.description ? `- ${row.slug}: ${row.description}` : `- ${row.slug}`
	);
	return { found: true, markdown: lines.join('\n') };
}

interface IndexRow {
	file: string;
	title: string;
	anchor: string | null;
	title_path: string | null;
}

/** Lists the pages of a source, each with its sections and their IDs. */
export function indexSource(db: DatabaseSync, source: string, scope: SourceScope): OperationResult {
	const sourceRow = findSource(db, source, scope);
	if (!sourceRow) return sourceNotFound(source);

	const rows = db
		.prepare(
			`SELECT pages.file, pages.title, snippets.anchor, snippets.title_path
			FROM live_pages AS pages
			LEFT JOIN snippets ON snippets.page_id = pages.id
			WHERE pages.source_id = ?
			ORDER BY ${PAGE_ORDER}, snippets.position`
		)
		.all(sourceRow.id) as unknown as IndexRow[];

	const lines = [`# ${source}`];
	if (sourceRow.description) lines.push('', sourceRow.description);
	lines.push('');
	let file: string | undefined;
	let anchor: string | null | undefined;
	for (const row of rows) {
		const page = { source, file: row.file };
		if (row.file !== file) {
			file = row.file;
			anchor = undefined;
			lines.push(`- ${grimoireId(page)}: ${row.title}`);
		}
		// The overview has no anchor, and the parts of a split section share one.
		if (row.anchor === null || row.anchor === anchor) continue;
		anchor = row.anchor;
		const titlePath: string[] = JSON.parse(row.title_path!);
		// A stored title path holds the page title before the section's own headings.
		const depth = titlePath.length - 1;
		lines.push(`${'  '.repeat(depth)}- ${grimoireId(page, anchor)}: ${titlePath.at(-1)}`);
	}
	return { found: true, markdown: lines.join('\n') };
}

/**
 * Lists the pages of a source as an llms.txt file, each linked to its HTTP route under `origin`.
 * Sections are left out: agents follow the links, not the IDs.
 */
export function llmsTxt(
	db: DatabaseSync,
	source: string,
	scope: SourceScope,
	origin: string
): OperationResult {
	const sourceRow = findSource(db, source, scope);
	if (!sourceRow) return sourceNotFound(source);

	const rows = db
		.prepare(
			`SELECT pages.file, pages.title FROM live_pages AS pages
			WHERE pages.source_id = ?
			ORDER BY ${PAGE_ORDER}`
		)
		.all(sourceRow.id) as { file: string; title: string }[];

	const lines = [`# ${source}`];
	if (sourceRow.description) lines.push('', `> ${sourceRow.description}`);
	lines.push('');
	for (const row of rows) {
		const path = grimoireId({ source, file: row.file })
			.split('/')
			.map(encodeURIComponent)
			.join('/');
		lines.push(`- [${linkText(row.title)}](${origin}/p/${path})`);
	}
	return { found: true, markdown: lines.join('\n') };
}

export interface QueryOptions {
	query: string;
	/** Slugs of the sources to search; all visible sources when undefined or empty. */
	sources?: string[];
	tokens?: number;
}

/** The answer of `query`; `missed` when the search found nothing. */
export interface QueryResult extends OperationResult {
	missed: boolean;
}

// Every word becomes a search term, and the search runs synchronously on the server thread: without
// a cap one request could hold it for seconds, and one key holder could fill the missed queries
// with request-sized questions. A real question is far shorter.
export const MAX_QUESTION_LENGTH = 500;

// Agents often send an optional list as `[]`; read literally it would search nothing.
function normalizeQueryOptions(options: QueryOptions): QueryOptions {
	return {
		...options,
		query: options.query.trim().slice(0, MAX_QUESTION_LENGTH),
		sources: options.sources?.length ? options.sources : undefined
	};
}

/**
 * Searches the visible sources, or the given ones, and returns as many hits as fit the budget.
 * The question is trimmed and cut to `MAX_QUESTION_LENGTH` characters.
 */
export function querySources(
	db: DatabaseSync,
	options: QueryOptions,
	scope: SourceScope
): QueryResult {
	const normalized = normalizeQueryOptions(options);
	const hidden = normalized.sources?.find((source) => !findSource(db, source, scope));
	if (hidden !== undefined) return { ...sourceNotFound(hidden), missed: false };
	const markdown = searchSnippets(db, { ...normalized, allowedSources: scope });
	if (markdown) return { found: true, markdown, missed: false };
	return {
		found: true,
		markdown: `No results for "${normalized.query}". Try other terms, or look at a source's \`index\`.`,
		missed: true
	};
}

/**
 * `querySources` for an agent: a query that found nothing is recorded for the admins. Queries
 * without an API key are not recorded: anyone could fill the list with them.
 */
export function agentQuery(
	db: DatabaseSync,
	options: QueryOptions,
	scope: SourceScope,
	now = new Date()
): QueryResult {
	const { query, sources } = normalizeQueryOptions(options);
	const result = querySources(db, options, scope);
	if (result.missed && query && scope !== 'public') {
		recordMissedQuery(db, { question: query, sources: sources ?? null }, now);
	}
	return result;
}

/**
 * Returns a whole page, or one section of it when an anchor is given. A section that was split
 * returns all its parts; an anchor of a small subsection merged into its parent returns the
 * parent.
 */
export function readById(
	db: DatabaseSync,
	location: SectionLocation,
	scope: SourceScope
): OperationResult {
	const hits = readSnippets(db, location, scope);
	if (hits.length === 0) return idNotFound(grimoireId(location, location.anchor || null));
	return { found: true, markdown: hits.map(renderSnippet).join('\n\n') };
}

// A `]` in a title would end the link text early, and llms.txt is parsed by other tools.
function linkText(text: string): string {
	return text.replace(/[\\[\]]/g, '\\$&');
}

function findSource(
	db: DatabaseSync,
	source: string,
	scope: SourceScope
): { id: number; description: string } | undefined {
	return db
		.prepare(`SELECT id, description FROM sources WHERE slug = :source AND ${IN_SCOPE}`)
		.get({ source, scope: scopeParameter(scope) }) as
		{ id: number; description: string } | undefined;
}

function sourceNotFound(source: string): OperationResult {
	return { found: false, markdown: `Source "${source}" not found. See \`sources\`.` };
}

/** The answer for an ID that names no visible page or section. */
export function idNotFound(id: string): OperationResult {
	return { found: false, markdown: `"${id}" not found. The source's \`index\` lists all IDs.` };
}
