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
	/** Other sources in scope that contain an unknown word, most matches first; only for a search restricted to sources. */
	elsewhere: string[];
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
	// Everything the caller may read: the first match of a word settles it. Anything narrower is
	// looked up source by source, within the ids of each one's snippets.
	const readable =
		sources !== null || options.allowedSources !== 'all'
			? readableSources(db, sources, options.allowedSources)
			: undefined;
	const occursHere = (match: string) =>
		readable ? occursIn(db, match, readable) : occursAnywhere(db, match);

	const expressions: string[] = [];
	const unknown: string[] = [];
	const notes: string[] = [];
	// Each word missing here, with the likely correction when only another source might hold it.
	const missed: string[][] = [];
	for (const term of searchTerms(options.query)) {
		const exact = toMatchExpression([term]);
		if (occursHere(exact)) {
			expressions.push(exact);
			continue;
		}
		unknown.push(term);
		const candidates =
			term.length >= MIN_TYPO_LENGTH
				? termsOneEditAway(db, term).slice(0, MAX_TYPO_CANDIDATES)
				: [];
		const fallback = searchInstead(term, candidates, occursHere);
		missed.push(fallback ? [term] : [term, ...candidates.slice(0, 1)]);
		expressions.push(...(fallback ? [fallback.match] : []));
		notes.push(fallback ? `${term} (searched as ${fallback.shown})` : term);
	}
	const elsewhere =
		sources && unknown.length > 0
			? otherSourcesContaining(db, missed, options.sources ?? [], options.allowedSources)
			: [];
	const nothing = { hits: [], skipped: [], unknown: [], elsewhere, markdown: '' };
	if (expressions.length === 0) return nothing;

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
	if (hits.length === 0) return nothing;

	const result = packIntoBudget(hits, options.tokens ?? DEFAULT_TOKENS);
	// Tells "not covered" (a subject the sources never name) from a weak match, and points to a
	// typo or a question in another language than the documentation.
	if (unknown.length === 0) return { ...result, unknown, elsewhere };
	const otherSources = elsewhere.length > 0 ? `\n${foundInOtherSources(elsewhere)}` : '';
	return {
		...result,
		unknown,
		elsewhere,
		markdown: `${result.markdown}\n\nNot in any searched source: ${notes.join(', ')}${otherSources}`
	};
}

/** The line naming the sources outside the search that hold the words it missed. */
export function foundInOtherSources(slugs: string[]): string {
	return `Found in other sources: ${slugs.join(', ')}`;
}

// More names than an agent would search one after the other.
const MAX_OTHER_SOURCES = 5;

// An agent picks sources by name and description; a wrong pick misses words another source holds.
// The matches are counted without a join, each assigned to its source by its id; only the sources
// named are checked with one.
function otherSourcesContaining(
	db: DatabaseSync,
	words: string[][],
	searched: string[],
	scope: SourceScope
): string[] {
	const readable = readableSources(db, null, scope).ids;
	const others = liveRanges(db).filter(
		(range) => readable.includes(range.id) && !searched.includes(range.slug)
	);
	if (others.length === 0) return [];
	const found = new Map<SourceRange, { words: number; matches: number }>();
	const lookup = db.prepare('SELECT rowid FROM snippets_fts WHERE snippets_fts MATCH :match');
	for (const forms of words) {
		const counted = new Set<SourceRange>();
		for (const { rowid } of lookup.iterate({ match: toMatchExpression(forms) }) as Iterable<{
			rowid: number;
		}>) {
			const range = rangeHolding(others, rowid);
			if (!range) continue;
			const tally = found.get(range) ?? { words: 0, matches: 0 };
			// The source holding most of the missed words is the likely topic, not the one that
			// repeats a common one most often.
			if (!counted.has(range)) tally.words++;
			counted.add(range);
			tally.matches++;
			found.set(range, tally);
		}
	}
	const match = toMatchExpression(words.flat());
	const named: string[] = [];
	const ranked = [...found].sort(
		([a, tallyA], [b, tallyB]) =>
			tallyB.words - tallyA.words || tallyB.matches - tallyA.matches || (a.slug < b.slug ? -1 : 1)
	);
	for (const [range] of ranked) {
		if (named.length === MAX_OTHER_SOURCES) break;
		if (occursIn(db, match, { ids: [range.id], runs: [range] })) named.push(range.slug);
	}
	return named;
}

// Measured with the benchmark over English and German documentation: one edit finds most typos
// and inflected forms (`instalieren`, `erstelen`, `begrenze`); two edits turn words of another
// language into unrelated ones. Shorter words have too many neighbours one edit away.
const MIN_TYPO_LENGTH = 4;
// Each candidate costs a lookup per searched range; the most common ones are the likely fixes.
const MAX_TYPO_CANDIDATES = 5;
// A prefix catches a longer form (`monatlich` in `monatlicher`) where no word is one edit away.
const MIN_PREFIX_LENGTH = 5;

/** What to search for a word no searched source contains: the closest index term, else its prefix. */
function searchInstead(
	term: string,
	candidates: string[],
	occursHere: (match: string) => boolean
): { match: string; shown: string } | null {
	const closest = candidates.find((candidate) => occursHere(toMatchExpression([candidate])));
	if (closest) return { match: toMatchExpression([closest]), shown: closest };
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

/** A source with live snippets and the lowest and highest of their ids. */
interface SourceRange {
	id: number;
	slug: string;
	first: number;
	last: number;
}

// FTS5 seeks a rowid range itself but knows no source: matching first and filtering by source
// after the join reads every match of a word that only other sources hold, 27 ms per word on
// 19,000 snippets against at most 1 ms within a range. A source's snippets are written in one go,
// so their ids lie close together. Writing an index raises the source's generation; until then its
// bounds are taken from here, as finding them takes 17 ms.
const boundsByDatabase = new WeakMap<
	DatabaseSync,
	Map<number, { generation: number; first: number; last: number }>
>();

/** Every source with live snippets, lowest ids first. */
function liveRanges(db: DatabaseSync): SourceRange[] {
	const cached = boundsByDatabase.get(db) ?? new Map();
	boundsByDatabase.set(db, cached);
	const sources = db
		.prepare('SELECT id, slug, index_generation AS generation FROM sources')
		.all() as { id: number; slug: string; generation: number }[];
	return sources
		.flatMap(({ id, slug, generation }) => {
			let bounds = cached.get(id);
			if (bounds?.generation !== generation) {
				const row = db
					.prepare(
						`SELECT min(snippets.id) AS first, max(snippets.id) AS last
						FROM live_pages AS pages JOIN snippets ON snippets.page_id = pages.id
						WHERE pages.source_id = ?`
					)
					.get(id) as { first: number | null; last: number | null };
				bounds = { generation, first: row.first ?? 0, last: row.last ?? -1 };
				cached.set(id, bounds);
			}
			return bounds.first <= bounds.last
				? [{ id, slug, first: bounds.first, last: bounds.last }]
				: [];
		})
		.sort((a, b) => a.first - b.first);
}

/** The range holding `rowid`, by binary search over ranges sorted by their first id. */
function rangeHolding(ranges: SourceRange[], rowid: number): SourceRange | undefined {
	let low = 0;
	let high = ranges.length - 1;
	while (low <= high) {
		const middle = (low + high) >> 1;
		if (ranges[middle].last < rowid) low = middle + 1;
		else if (ranges[middle].first > rowid) high = middle - 1;
		else return ranges[middle];
	}
	return undefined;
}

/**
 * The sources in scope, or the given ones of them, and the id ranges that cover their snippets:
 * neighbouring ranges merge until one of a source outside lies between, so one large internal
 * source among many small public ones leaves at most two.
 */
function readableSources(
	db: DatabaseSync,
	sources: string | null,
	scope: SourceScope
): { ids: number[]; runs: { first: number; last: number }[] } {
	const ids = (
		db
			.prepare(
				`SELECT id FROM sources
				WHERE (:sources IS NULL OR slug IN (SELECT value FROM json_each(:sources))) AND ${IN_SCOPE}`
			)
			.all({ sources, scope: scopeParameter(scope) }) as { id: number }[]
	).map((row) => row.id);
	const runs: { first: number; last: number }[] = [];
	let open = false;
	for (const range of liveRanges(db)) {
		if (!ids.includes(range.id)) {
			open = false;
		} else if (open) {
			runs[runs.length - 1].last = Math.max(runs[runs.length - 1].last, range.last);
		} else {
			runs.push({ first: range.first, last: range.last });
			open = true;
		}
	}
	return { ids, runs };
}

// No ORDER BY: the first match ends the lookup, where sorting would read every match first.
function occursAnywhere(db: DatabaseSync, match: string): boolean {
	return (
		db
			.prepare(
				`SELECT 1 FROM snippets_fts
				JOIN snippets ON snippets.id = snippets_fts.rowid
				JOIN live_pages AS pages ON pages.id = snippets.page_id
				WHERE snippets_fts MATCH :match
				LIMIT 1`
			)
			.get({ match }) !== undefined
	);
}

// The join keeps out rows of another source or an old index that lie inside a range.
function occursIn(
	db: DatabaseSync,
	match: string,
	readable: { ids: number[]; runs: { first: number; last: number }[] }
): boolean {
	const lookup = db.prepare(
		`SELECT 1 FROM snippets_fts
		JOIN snippets ON snippets.id = snippets_fts.rowid
		JOIN live_pages AS pages ON pages.id = snippets.page_id
		WHERE snippets_fts MATCH :match
			AND snippets_fts.rowid BETWEEN :first AND :last
			AND pages.source_id IN (SELECT value FROM json_each(:ids))
		LIMIT 1`
	);
	const ids = JSON.stringify(readable.ids);
	return readable.runs.some(
		({ first, last }) => lookup.get({ match, first, last, ids }) !== undefined
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

function packIntoBudget(
	hits: SnippetHit[],
	budget: number
): Omit<SearchResult, 'unknown' | 'elsewhere'> {
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
