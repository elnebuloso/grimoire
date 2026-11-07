import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { availableParallelism } from 'node:os';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../src/lib/server/db/schema';
import { grimoireId } from '../src/lib/server/grimoire-id';
import { querySources } from '../src/lib/server/agent/operations';
import { syncSource } from '../src/lib/server/sync/sync';
import { DOCUMENTATIONS, type Documentation } from './documentations';
import { FIXTURE_BRANCH, fixtureRepository } from './fixture';

// Kubernetes has 2,500 pages: indexing takes minutes, not seconds.
const INDEXING_DEADLINE_MS = 30 * 60_000;
// The fixture repository is local; a server never allows `file://`.
const LOCAL = { allowedHosts: [], proxy: false, allowLocal: true };
// Times and memory vary from run to run; the median of these runs is compared.
const INDEXING_RUNS = Number(process.env.BENCHMARK_RUNS ?? 3);
const SEARCH_REPEATS = 5;
// A value beyond this many times its baseline fails; anything below is noise on a shared machine.
const TOLERANCE = 2;
const UPDATE = process.env.BENCHMARK_UPDATE === '1';

let url: string;
let root: string;

beforeAll(() => {
	url = fixtureRepository();
	root = mkdtempSync(join(tmpdir(), 'grimoire-benchmark-'));
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

/** Indexes one documentation into a fresh database through a real sync; how long and how much memory it took. */
async function indexed(documentation: Documentation) {
	const directory = mkdtempSync(join(root, `${documentation.name}-`));
	const db = openDatabase(join(directory, 'grimoire.db'));
	db.prepare(
		`INSERT INTO sources (id, slug, name, git_url, branch, path, exclusions)
		VALUES (1, ?, ?, ?, ?, ?, ?)`
	).run(
		documentation.name,
		documentation.name,
		url,
		FIXTURE_BRANCH,
		documentation.path,
		JSON.stringify(documentation.exclusions ?? [])
	);
	const started = performance.now();
	const result = await syncSource(db, 1, {
		key: Buffer.alloc(32),
		policy: LOCAL,
		workDirectory: directory,
		indexingDeadlineMs: INDEXING_DEADLINE_MS
	});
	if (result.status !== 'synced')
		throw new Error(`${documentation.name}: ${JSON.stringify(result)}`);
	return {
		db,
		seconds: (performance.now() - started) / 1000,
		peakMemoryMb: (result.peakMemoryKb ?? 0) / 1024
	};
}

const json = (value: unknown) => `${JSON.stringify(value, null, '\t')}\n`;

function median(values: number[]): number {
	const sorted = values.toSorted((a, b) => a - b);
	return sorted[Math.floor(sorted.length / 2)];
}

function percentile(values: number[], share: number): number {
	const sorted = values.toSorted((a, b) => a - b);
	return sorted[Math.min(sorted.length - 1, Math.ceil(share * sorted.length) - 1)];
}

/**
 * What the index holds, in an order that does not depend on how it was written: one line per
 * snippet ID, the counts, the dead links and the warnings. Nothing time-dependent.
 */
function indexReport(db: DatabaseSync, slug: string): string {
	const snippets = db
		.prepare(
			`SELECT pages.file, snippets.anchor, snippets.part, snippets.parts, snippets.tokens
			FROM snippets JOIN live_pages AS pages ON pages.id = snippets.page_id
			ORDER BY pages.file, snippets.position`
		)
		.all() as {
		file: string;
		anchor: string | null;
		part: number;
		parts: number;
		tokens: number;
	}[];
	const pages = db.prepare('SELECT count(*) AS n FROM live_pages').get() as { n: number };
	const deadLinks = db
		.prepare(
			`SELECT pages.file, links.anchor, links.target FROM links
			JOIN live_pages AS pages ON pages.id = links.page_id
			WHERE links.dead = 1 ORDER BY pages.file, links.anchor, links.target`
		)
		.all() as { file: string; anchor: string | null; target: string }[];
	const { warnings } = db.prepare('SELECT warnings FROM sources').get() as { warnings: string };
	return json({
		pages: pages.n,
		snippets: snippets.length,
		tokens: snippets.reduce((sum, snippet) => sum + snippet.tokens, 0),
		deadLinks: deadLinks.map(({ file, anchor, target }) =>
			[grimoireId({ source: slug, file }, anchor), target].join(' -> ')
		),
		warnings: (JSON.parse(warnings) as string[]).toSorted(),
		ids: snippets.map(({ file, anchor, part, parts }) => {
			const id = grimoireId({ source: slug, file }, anchor);
			return parts > 1 ? `${id} (${part}/${parts})` : id;
		})
	});
}

interface Question {
	question: string;
	kind: string;
	expected: string[];
}

function questionsOf(documentation: Documentation): Question[] {
	const file = join(import.meta.dirname, 'questions', `${documentation.name}.json`);
	return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Question[]) : [];
}

/** The IDs `query` returns for `question`, best first, as an agent sends it (all hits, no budget cut). */
function rankedIds(db: DatabaseSync, question: string): string[] {
	const { hits } = querySources(db, { query: question, tokens: 1_000_000_000 }, 'all');
	return hits.map((hit) => grimoireId(hit, hit.anchor));
}

/**
 * Where `query` ranks the expected section of each question, and the summary: hits at rank 1,
 * within 3 and 10, the mean reciprocal rank, and how many questions without an answer got hits.
 */
function searchReport(db: DatabaseSync, questions: Question[]): string {
	const rows = questions.map((question) => {
		const ids = rankedIds(db, question.question);
		const rank = ids.findIndex((id) => question.expected.includes(id)) + 1;
		return { ...question, rank, hits: ids.length };
	});
	const answerable = rows.filter((row) => row.expected.length > 0);
	const within = (limit: number) =>
		answerable.filter((row) => row.rank > 0 && row.rank <= limit).length;
	const reciprocal = answerable.reduce((sum, row) => sum + (row.rank > 0 ? 1 / row.rank : 0), 0);
	return json({
		answerable: answerable.length,
		rank1: within(1),
		within3: within(3),
		within10: within(10),
		meanReciprocalRank: Number((reciprocal / Math.max(1, answerable.length)).toFixed(3)),
		unanswerableWithHits: rows.filter((row) => row.expected.length === 0 && row.hits > 0).length,
		questions: rows.map((row) =>
			row.expected.length === 0
				? `none: ${row.hits} hits | ${row.question}`
				: `${row.rank > 0 ? `rank ${row.rank}` : 'not found'} | ${row.kind} | ${row.question}`
		)
	});
}

/** Answer times of the questions in milliseconds, after one warm-up pass. */
function searchTimes(db: DatabaseSync, questions: Question[]): number[] {
	for (const question of questions) rankedIds(db, question.question);
	const times: number[] = [];
	for (let repeat = 0; repeat < SEARCH_REPEATS; repeat++) {
		for (const question of questions) {
			const started = performance.now();
			rankedIds(db, question.question);
			times.push(performance.now() - started);
		}
	}
	return times;
}

for (const documentation of DOCUMENTATIONS) {
	describe(documentation.name, () => {
		let db: DatabaseSync;
		const runs: { seconds: number; peakMemoryMb: number }[] = [];
		const questions = questionsOf(documentation);

		beforeAll(async () => {
			for (let run = 0; run < INDEXING_RUNS; run++) {
				const result = await indexed(documentation);
				runs.push(result);
				// The first index is the one checked; the others only count time and memory.
				if (run === 0) db = result.db;
				else result.db.close();
			}
		}, INDEXING_RUNS * INDEXING_DEADLINE_MS);

		afterAll(() => db?.close());

		it('index', async () => {
			await expect(indexReport(db, documentation.name)).toMatchFileSnapshot(
				`baseline/${documentation.name}.index.json`
			);
		});

		it.skipIf(questions.length === 0)('search', async () => {
			await expect(searchReport(db, questions)).toMatchFileSnapshot(
				`baseline/${documentation.name}.search.json`
			);
		});

		it('time and memory', () => {
			const times = searchTimes(
				db,
				questions.length > 0 ? questions : [{ question: 'install', kind: 'short', expected: [] }]
			);
			const measured = {
				indexingSeconds: Number(median(runs.map((run) => run.seconds)).toFixed(1)),
				peakMemoryMb: Math.round(median(runs.map((run) => run.peakMemoryMb))),
				searchMedianMs: Number(median(times).toFixed(2)),
				searchP95Ms: Number(percentile(times, 0.95).toFixed(2))
			};
			const file = join(import.meta.dirname, 'baseline', `${documentation.name}.performance.json`);
			if (UPDATE || !existsSync(file)) {
				writeFileSync(
					file,
					json({ cores: availableParallelism(), runs: INDEXING_RUNS, ...measured })
				);
				expect(existsSync(file)).toBe(true);
				return;
			}
			const baseline = JSON.parse(readFileSync(file, 'utf8')) as typeof measured;
			console.info(
				`${documentation.name}: ${JSON.stringify(measured)}, baseline ${JSON.stringify(baseline)}`
			);
			for (const [key, value] of Object.entries(measured) as [keyof typeof measured, number][]) {
				expect(value, `${key} more than ${TOLERANCE}x its baseline`).toBeLessThanOrEqual(
					baseline[key] * TOLERANCE
				);
			}
		});
	});
}
