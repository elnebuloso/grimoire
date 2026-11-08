import { posix } from 'node:path';
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import { estimateTokens } from '../parsing/chunk';
import { redactUrl } from '../redact-url';
import type { KeyScope, SourceScope } from '../api-keys';
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

// The read rule, decided here for every page and API: a visitor reads the public sources, a
// logged-in user every source, an API key what it opens and the public ones.

/** Who reads: a visitor without login or key, a logged-in user, or an API key. */
export type Viewer = 'visitor' | 'user' | { key: KeyScope };

/** The sources `viewer` may read. */
export function viewerScope(viewer: Viewer): SourceScope {
	if (viewer === 'visitor') return 'public';
	if (viewer === 'user') return 'all';
	return viewer.key;
}

/** Matches the rows of `sources` in a scope, bound as `:scope` with `scopeParameter`. */
export const IN_SCOPE = `(:scope IS NULL OR sources.visibility = 'public'
	OR sources.slug IN (SELECT value FROM json_each(:scope)))`;

export function scopeParameter(scope: SourceScope): string | null {
	if (scope === 'all') return null;
	return JSON.stringify(scope === 'public' ? [] : scope);
}

/** `IN_SCOPE` for a source already read. */
export function inScope(scope: SourceScope, source: { slug: string; visibility: string }): boolean {
	if (scope === 'all' || source.visibility === 'public') return true;
	return scope !== 'public' && scope.includes(source.slug);
}

/** Whether `scope` holds any source at all. */
export function scopeHasSources(db: DatabaseSync, scope: SourceScope): boolean {
	return (
		db
			.prepare(`SELECT 1 FROM sources WHERE ${IN_SCOPE} LIMIT 1`)
			.get({ scope: scopeParameter(scope) }) !== undefined
	);
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

/** What a search found within its budget: the hits, the IDs that did not fit and the rendering. */
export interface SearchResult {
	hits: SnippetHit[];
	skipped: string[];
	/** Searched words that occur in no snippet of the searched sources. */
	unknown: string[];
	/** The answer an agent gets: the rendered hits and lines naming the skipped IDs and unknown words. */
	markdown: string;
}

/**
 * Full-text search over all snippets, ranked by BM25 with the title path weighted above the
 * text and the text above code. Returns the rendered hits in ranking order, as many as fit into
 * the token budget, followed by a line naming the IDs of hits that did not fit, and the packed
 * hits themselves for a page that shows them on its own.
 */
export function searchHits(db: DatabaseSync, options: SearchOptions): SearchResult {
	const sources = options.sources ? JSON.stringify(options.sources) : null;
	const occursHere = (match: string) => occurs(db, match, sources, options.allowedSources);

	const expressions: string[] = [];
	const unknown: string[] = [];
	const notes: string[] = [];
	for (const term of searchTerms(options.query)) {
		const exact = toMatchExpression([term]);
		if (occursHere(exact)) {
			expressions.push(exact);
			continue;
		}
		unknown.push(term);
		const fallback = searchInstead(db, term, occursHere);
		expressions.push(...(fallback ? [fallback.match] : []));
		notes.push(fallback ? `${term} (searched as ${fallback.shown})` : term);
	}
	if (expressions.length === 0) return { hits: [], skipped: [], unknown: [], markdown: '' };

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
			// The snippet's id after an equal score: the same index always gives the same order.
			orderBy: 'bm25(snippets_fts, 10, 1, 0.25), snippets.id',
			limit: MAX_HITS
		},
		{ match: expressions.join(' OR '), sources },
		options.allowedSources
	);
	if (hits.length === 0) return { hits: [], skipped: [], unknown: [], markdown: '' };

	const result = packIntoBudget(hits, options.tokens ?? DEFAULT_TOKENS);
	// Tells "not covered" (a subject the sources never name) from a weak match, and points to a
	// typo or a question in another language than the documentation.
	if (unknown.length === 0) return { ...result, unknown };
	return {
		...result,
		unknown,
		markdown: `${result.markdown}\n\nNot in any searched source: ${notes.join(', ')}`
	};
}

// Measured with the benchmark over English and German documentation: one edit finds most typos
// and inflected forms (`instalieren`, `erstelen`, `begrenze`); two edits turn words of another
// language into unrelated ones. Shorter words have too many neighbours one edit away.
const MIN_TYPO_LENGTH = 4;
// A prefix catches a longer form (`monatlich` in `monatlicher`) where no word is one edit away.
const MIN_PREFIX_LENGTH = 5;

/** What to search for a word no searched source contains: the closest index term, else its prefix. */
function searchInstead(
	db: DatabaseSync,
	term: string,
	occursHere: (match: string) => boolean
): { match: string; shown: string } | null {
	if (term.length >= MIN_TYPO_LENGTH) {
		const closest = termsOneEditAway(db, term).find((candidate) =>
			occursHere(toMatchExpression([candidate]))
		);
		if (closest) return { match: toMatchExpression([closest]), shown: closest };
	}
	if (term.length >= MIN_PREFIX_LENGTH && occursHere(`"${term}"*`)) {
		return { match: `"${term}"*`, shown: `${term}*` };
	}
	return null;
}

// Per connection: a temp table needs no migration and reads the index as it is now.
const withVocabulary = new WeakSet<DatabaseSync>();

// Index terms one edit away, most common first. The vocabulary spans every source; the caller
// checks each candidate in its own scope. The first two letters are taken as typed: no typo of the
// benchmark changes them, and scanning by one letter took up to 4 ms per word on 37,000 terms.
function termsOneEditAway(db: DatabaseSync, typed: string): string[] {
	// The vocabulary holds `anderungen` for "Änderungen": the tokenizer drops the diacritics of
	// Latin letters, so an umlaut would spend the one edit or miss the first two letters.
	const term = typed
		.normalize('NFD')
		.replace(/(\p{Script=Latin})\p{Mn}+/gu, '$1')
		.normalize('NFC');
	if (!withVocabulary.has(db)) {
		db.exec(
			'CREATE VIRTUAL TABLE IF NOT EXISTS temp.snippets_vocab USING fts5vocab(main, snippets_fts, row)'
		);
		withVocabulary.add(db);
	}
	const start = term.slice(0, 2);
	const rows = db
		.prepare(
			`SELECT term, doc FROM temp.snippets_vocab
			WHERE term >= :from AND term < :to AND length(term) BETWEEN :shortest AND :longest`
		)
		.all({
			from: start,
			to: start.slice(0, -1) + String.fromCodePoint(start.codePointAt(start.length - 1)! + 1),
			shortest: term.length - 1,
			longest: term.length + 1
		}) as { term: string; doc: number }[];
	return rows
		.filter((row) => editDistance(term, row.term, 1) <= 1)
		.sort((a, b) => b.doc - a.doc || (a.term < b.term ? -1 : 1))
		.map((row) => row.term);
}

/** Optimal string alignment distance (a swap of neighbours counts once), cut off past `limit`. */
function editDistance(a: string, b: string, limit: number): number {
	if (Math.abs(a.length - b.length) > limit) return limit + 1;
	let before = Array.from({ length: b.length + 1 }, (_, j) => j);
	let previous = before;
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		let rowMin = i;
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			let value = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
			if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
				value = Math.min(value, before[j - 2] + 1);
			current.push(value);
			rowMin = Math.min(rowMin, value);
		}
		if (rowMin > limit) return limit + 1;
		before = previous;
		previous = current;
	}
	return previous[b.length];
}

// Only the searched sources the caller may see count: a word from a hidden source must not show.
// No ORDER BY: the first match ends the lookup, where sorting would read every match first.
function occurs(
	db: DatabaseSync,
	match: string,
	sources: string | null,
	scope: SourceScope
): boolean {
	return (
		db
			.prepare(
				`SELECT 1 FROM snippets_fts
				JOIN snippets ON snippets.id = snippets_fts.rowid
				JOIN live_pages AS pages ON pages.id = snippets.page_id
				JOIN sources ON sources.id = pages.source_id
				WHERE snippets_fts MATCH :match
					AND (:sources IS NULL OR sources.slug IN (SELECT value FROM json_each(:sources)))
					AND ${IN_SCOPE}
				LIMIT 1`
			)
			.get({ match, sources, scope: scopeParameter(scope) }) !== undefined
	);
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

// Each OR term multiplies the work of one search, which blocks the server while it runs: 250
// terms took over a minute on 50,000 snippets. A question rarely needs more than a few words.
const MAX_SEARCH_TERMS = 16;

const SEARCH_WORD = /[\p{L}\p{N}_]+/gu;

/** Whether `query` has a word to search for; a question of punctuation alone searches nothing. */
export function hasSearchTerms(query: string): boolean {
	return query.match(SEARCH_WORD) !== null;
}

// Raw input breaks FTS5 syntax (`auth-service` reads as a column filter, `?` and `=` are errors).
// OR keeps natural-language questions matching; BM25 still ranks hits with more terms higher.
// Words that name nothing a page could be about; agents ask in English and German. Short terms
// such as `sso` or `jwt` must not lose their place under the cap to these.
const STOPWORDS = new Set(
	(
		'a an and are as at be but by can do does for from how i if in into is it its may me must my ' +
		'no not of on or our should so than that the their then there these this to was we what when ' +
		'where which who why will with would you your keep get use using ' +
		// NLTK's English list without the direction words (`down`, `all`, `before`, …), which
		// carry meaning in technical questions such as "scale down" or "deny all ingress".
		'about again against am any been because being between both did doing don during each ' +
		'few further had has have having he her here hers herself him himself his itself just me ' +
		'most myself nor now once other ours ourselves own s she some such t them themselves ' +
		'they theirs those through too until very were while whom yours yourself yourselves ' +
		'aber als am an auch auf aus bei bin bis da das dass dem den der des die du ein eine einen ' +
		'einem einer es für hat ich im in ist kann man mit muss nach nicht noch oder sich sie sind so ' +
		'über um und von vom wann was welche wenn wer wie wir wird wo zu zum zur'
	).split(' ')
);

function searchTerms(query: string): string[] {
	const words = query.match(SEARCH_WORD) ?? [];
	const distinct = [...new Set(words.map((word) => word.toLowerCase()))];
	const meaningful = distinct.filter((word) => !STOPWORDS.has(word));
	// The longest words: a long question starts with "how do I", and its specific terms come last.
	return (meaningful.length > 0 ? meaningful : distinct)
		.toSorted((a, b) => b.length - a.length)
		.slice(0, MAX_SEARCH_TERMS);
}

function toMatchExpression(terms: string[]): string {
	return terms.map((term) => `"${term}"`).join(' OR ');
}

function packIntoBudget(hits: SnippetHit[], budget: number): Omit<SearchResult, 'unknown'> {
	const packed: SnippetHit[] = [];
	const blocks: string[] = [];
	// The parts of a long section share one ID.
	const skipped = new Set<string>();
	let remaining = budget;
	for (const hit of hits) {
		const block = renderSnippet(hit);
		const tokens = estimateTokens(`${block}\n\n`);
		if (tokens > remaining) {
			skipped.add(grimoireId(hit, hit.anchor));
			continue;
		}
		packed.push(hit);
		blocks.push(block);
		remaining -= tokens;
	}
	if (skipped.size > 0) blocks.push(`Did not fit: ${[...skipped].join(', ')}`);
	return { hits: packed, skipped: [...skipped], markdown: blocks.join('\n\n') };
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
