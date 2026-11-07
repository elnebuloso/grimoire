import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../src/lib/server/db/schema';
import { grimoireId } from '../src/lib/server/grimoire-id';
import { syncSource } from '../src/lib/server/sync/sync';
import { DOCUMENTATIONS, type Documentation } from './documentations';
import { FIXTURE_BRANCH, fixtureRepository } from './fixture';

// Kubernetes has 2,500 pages: indexing takes minutes, not seconds.
const INDEXING_DEADLINE_MS = 30 * 60_000;
// The fixture repository is local; a server never allows `file://`.
const LOCAL = { allowedHosts: [], proxy: false, allowLocal: true };

let url: string;
let root: string;

beforeAll(() => {
	url = fixtureRepository();
	root = mkdtempSync(join(tmpdir(), 'grimoire-benchmark-'));
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

/** Indexes one documentation into a fresh database through a real sync. */
async function indexed(documentation: Documentation): Promise<DatabaseSync> {
	const directory = mkdtempSync(join(root, `${documentation.name}-`));
	const db = openDatabase(join(directory, 'grimoire.db'));
	db.prepare(
		`INSERT INTO sources (id, slug, name, git_url, branch, path) VALUES (1, ?, ?, ?, ?, ?)`
	).run(documentation.name, documentation.name, url, FIXTURE_BRANCH, documentation.path);
	const result = await syncSource(db, 1, {
		key: Buffer.alloc(32),
		policy: LOCAL,
		workDirectory: directory,
		indexingDeadlineMs: INDEXING_DEADLINE_MS
	});
	if (result.status !== 'synced')
		throw new Error(`${documentation.name}: ${JSON.stringify(result)}`);
	return db;
}

/**
 * What the index holds, in an order that does not depend on how it was written: one line per
 * snippet ID, the counts, the dead links and the warnings. Nothing time-dependent.
 */
function report(db: DatabaseSync, slug: string): string {
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
	const ids = snippets.map(({ file, anchor, part, parts }) => {
		const id = grimoireId({ source: slug, file }, anchor);
		return parts > 1 ? `${id} (${part}/${parts})` : id;
	});
	return `${JSON.stringify(
		{
			pages: pages.n,
			snippets: snippets.length,
			tokens: snippets.reduce((sum, snippet) => sum + snippet.tokens, 0),
			deadLinks: deadLinks.map(({ file, anchor, target }) =>
				[grimoireId({ source: slug, file }, anchor), target].join(' -> ')
			),
			warnings: (JSON.parse(warnings) as string[]).toSorted(),
			ids
		},
		null,
		'\t'
	)}\n`;
}

describe('index', () => {
	for (const documentation of DOCUMENTATIONS) {
		it(documentation.name, async () => {
			const db = await indexed(documentation);
			try {
				await expect(report(db, documentation.name)).toMatchFileSnapshot(
					`baseline/${documentation.name}.index.json`
				);
			} finally {
				db.close();
			}
		});
	}
});
