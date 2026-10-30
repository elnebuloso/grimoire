import type { DatabaseSync } from 'node:sqlite';
import type { ProjectScope } from '../api-keys';
import { grimoireId, type SectionLocation } from '../grimoire-id';
import {
	IN_SCOPE,
	renderSnippet,
	scopeParameter,
	searchSnippets,
	selectSnippets,
	type SnippetHit
} from '../search/query';
import { recordMissedQuery } from '../missed-queries';
import instructions from './instructions.md?raw';

/** How agents use grimoire; the same text for HTTP and as MCP server instructions. */
export const agentInstructions = instructions;

/** The answer of an operation; `found` is false for an unknown or hidden project or ID. */
export interface OperationResult {
	found: boolean;
	markdown: string;
}

// Pages in the site's `nav` first, in its order, then the rest by file path.
const PAGE_ORDER = 'pages.nav_position IS NULL, pages.nav_position, pages.file';

/** Lists the visible projects with their short description. */
export function listProjects(db: DatabaseSync, scope: ProjectScope): OperationResult {
	const rows = db
		.prepare(`SELECT slug, description FROM projects WHERE ${IN_SCOPE} ORDER BY slug`)
		.all({ scope: scopeParameter(scope) }) as { slug: string; description: string }[];
	if (rows.length === 0) return { found: true, markdown: 'No projects.' };
	const lines = rows.map((row) =>
		row.description ? `- ${row.slug}: ${row.description}` : `- ${row.slug}`
	);
	return { found: true, markdown: lines.join('\n') };
}

interface IndexRow {
	source: string;
	file: string | null;
	title: string | null;
	anchor: string | null;
	title_path: string | null;
}

/** Lists the pages of a project, source by source, each with its sections and their IDs. */
export function indexProject(
	db: DatabaseSync,
	project: string,
	scope: ProjectScope
): OperationResult {
	const projectRow = findProject(db, project, scope);
	if (!projectRow) return projectNotFound(project);

	const rows = db
		.prepare(
			`SELECT sources.slug AS source, pages.file, pages.title, snippets.anchor, snippets.title_path
			FROM sources
			LEFT JOIN live_pages AS pages ON pages.source_id = sources.id
			LEFT JOIN snippets ON snippets.page_id = pages.id
			WHERE sources.project_id = ?
			ORDER BY sources.slug, ${PAGE_ORDER}, snippets.position`
		)
		.all(projectRow.id) as unknown as IndexRow[];

	const lines = [`# ${project}`];
	if (projectRow.description) lines.push('', projectRow.description);
	let source: string | undefined;
	let file: string | null | undefined;
	let anchor: string | null | undefined;
	for (const row of rows) {
		if (row.source !== source) {
			source = row.source;
			file = undefined;
			lines.push('', `## ${source}`, '');
		}
		if (row.file === null) continue;
		const page = { project, source: row.source, file: row.file };
		const pageId = grimoireId(page);
		if (row.file !== file) {
			file = row.file;
			anchor = undefined;
			lines.push(`- ${pageId}: ${row.title}`);
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
 * Lists the pages of a project as an llms.txt file, each linked to its HTTP route under
 * `origin`. Sections are left out: agents follow the links, not the IDs.
 */
export function llmsTxt(
	db: DatabaseSync,
	project: string,
	scope: ProjectScope,
	origin: string
): OperationResult {
	const projectRow = findProject(db, project, scope);
	if (!projectRow) return projectNotFound(project);

	const rows = db
		.prepare(
			`SELECT sources.slug AS source, pages.file, pages.title
			FROM sources
			LEFT JOIN live_pages AS pages ON pages.source_id = sources.id
			WHERE sources.project_id = ?
			ORDER BY sources.slug, ${PAGE_ORDER}`
		)
		.all(projectRow.id) as { source: string; file: string | null; title: string | null }[];

	const lines = [`# ${project}`];
	if (projectRow.description) lines.push('', `> ${projectRow.description}`);
	let source: string | undefined;
	for (const row of rows) {
		if (row.source !== source) {
			source = row.source;
			lines.push('', `## ${source}`, '');
		}
		if (row.file === null) continue;
		const path = grimoireId({ project, source: row.source, file: row.file })
			.split('/')
			.map(encodeURIComponent)
			.join('/');
		lines.push(`- [${linkText(row.title!)}](${origin}/p/${path})`);
	}
	return { found: true, markdown: lines.join('\n') };
}

export interface QueryOptions {
	query: string;
	project?: string;
	tokens?: number;
}

/** The answer of `query`; `missed` when the search found nothing. */
export interface QueryResult extends OperationResult {
	missed: boolean;
}

/** Searches the visible projects, or one of them, and returns as many hits as fit the budget. */
export function queryProjects(
	db: DatabaseSync,
	options: QueryOptions,
	scope: ProjectScope
): QueryResult {
	if (options.project !== undefined && !projectVisible(db, options.project, scope)) {
		return { ...projectNotFound(options.project), missed: false };
	}
	const markdown = searchSnippets(db, { ...options, allowedProjects: scope });
	if (markdown) return { found: true, markdown, missed: false };
	return {
		found: true,
		markdown: `No results for "${options.query}". Try other terms, or look at a project's \`index\`.`,
		missed: true
	};
}

// Every miss is stored, and every word becomes a search term: without a cap one key holder could
// fill the database with request-sized questions. A real question is far shorter.
export const MAX_QUESTION_LENGTH = 500;

/**
 * `queryProjects` for an agent: the question is cut to `MAX_QUESTION_LENGTH` characters, and a
 * query that found nothing is recorded for the admins.
 */
export function agentQuery(
	db: DatabaseSync,
	options: QueryOptions,
	scope: ProjectScope,
	now = new Date()
): QueryResult {
	const query = options.query.slice(0, MAX_QUESTION_LENGTH);
	const result = queryProjects(db, { ...options, query }, scope);
	if (result.missed) {
		recordMissedQuery(db, { question: query, project: options.project ?? null }, now);
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
	scope: ProjectScope
): OperationResult {
	const hits = readSnippets(db, location, scope);
	if (hits.length === 0) return idNotFound(grimoireId(location, location.anchor || null));
	return { found: true, markdown: hits.map(renderSnippet).join('\n\n') };
}

/** The snippets `readById` renders, in page order; empty for an unknown page or section. */
export function readSnippets(
	db: DatabaseSync,
	location: SectionLocation,
	scope: ProjectScope
): SnippetHit[] {
	// An empty anchor names no section, so `?section=` and an ID ending in `#` read the page.
	const anchor = location.anchor || null;
	return selectSnippets(
		db,
		{
			where: `projects.slug = :project AND sources.slug = :source AND pages.file = :file
				AND (:anchor IS NULL OR snippets.anchor = :anchor
					OR :anchor IN (SELECT value FROM json_each(snippets.aliases)))`,
			orderBy: 'snippets.position'
		},
		{ project: location.project, source: location.source, file: location.file, anchor },
		scope
	);
}

// A `]` in a title would end the link text early, and llms.txt is parsed by other tools.
function linkText(text: string): string {
	return text.replace(/[\\[\]]/g, '\\$&');
}

function findProject(
	db: DatabaseSync,
	project: string,
	scope: ProjectScope
): { id: number; description: string } | undefined {
	return db
		.prepare(`SELECT id, description FROM projects WHERE slug = :project AND ${IN_SCOPE}`)
		.get({ project, scope: scopeParameter(scope) }) as
		{ id: number; description: string } | undefined;
}

function projectVisible(db: DatabaseSync, project: string, scope: ProjectScope): boolean {
	return findProject(db, project, scope) !== undefined;
}

function projectNotFound(project: string): OperationResult {
	return { found: false, markdown: `Project "${project}" not found. See \`projects\`.` };
}

/** The answer for an ID that names no visible page or section. */
export function idNotFound(id: string): OperationResult {
	return { found: false, markdown: `"${id}" not found. The project's \`index\` lists all IDs.` };
}
