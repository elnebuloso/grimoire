import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import { readById } from '../agent/operations';
import { parseGrimoireId } from '../grimoire-id';
import {
	dashboard,
	deadLinks,
	needsAttention,
	previewPage,
	sourceHealth,
	sourceStatus
} from './status';

let db: DatabaseSync;

function insertPage(
	sourceId: number,
	file: string,
	snippets: { anchor: string | null; tokens: number }[]
) {
	const pageId = Number(
		db
			.prepare(`INSERT INTO pages (source_id, file, title, content) VALUES (?, ?, ?, '')`)
			.run(sourceId, file, `Title of ${file}`).lastInsertRowid
	);
	snippets.forEach(({ anchor, tokens }, position) => {
		db.prepare(
			`INSERT INTO snippets (page_id, position, anchor, title_path, content, tokens)
			VALUES (?, ?, ?, '["Title"]', ?, ?)`
		).run(pageId, position, anchor, `Content of ${file} ${position}`, tokens);
	});
	return pageId;
}

function insertLink(pageId: number, anchor: string | null, target: string, dead: boolean) {
	db.prepare('INSERT INTO links (page_id, anchor, target, dead) VALUES (?, ?, ?, ?)').run(
		pageId,
		anchor,
		target,
		dead ? 1 : 0
	);
}

beforeEach(() => {
	db = openDatabase(':memory:');
	db.exec(`
		INSERT INTO sources (id, slug, name, git_url, branch, path)
		VALUES (1, 'auth', 'Auth', 'https://git.example.com/auth.git', 'main', 'docs/'),
			(2, 'billing', 'Billing', 'https://git.example.com/billing.git', 'main', 'docs/');
	`);
});

describe('sourceStatus', () => {
	it('reports a source that was never synced', () => {
		expect(sourceStatus(db, 1)!).toEqual({
			lastCheckedAt: null,
			lastSyncedAt: null,
			lastCommit: null,
			error: null,
			warnings: [],
			pages: [],
			totals: { pages: 0, snippets: 0, tokens: 0 },
			deadLinks: [],
			history: []
		});
	});

	it('counts pages, snippets and tokens of this source only, and lists its dead links', () => {
		const deploy = insertPage(1, 'deploy.md', [
			{ anchor: null, tokens: 10 },
			{ anchor: 'rollback', tokens: 25 }
		]);
		const index = insertPage(1, 'index.md', [{ anchor: null, tokens: 5 }]);
		insertPage(2, 'other.md', [{ anchor: null, tokens: 1000 }]);
		insertLink(deploy, 'rollback', 'auth/missing', true);
		insertLink(index, null, 'auth/deploy#nope', true);
		insertLink(index, null, 'auth/deploy', false);
		db.prepare(
			`UPDATE sources SET last_commit = 'abc', last_synced_at = '2026-10-01T10:00:00.000Z',
				error = 'git ls-remote failed', warnings = '["broken.md: unclosed include"]'
			WHERE id = 1`
		).run();

		expect(sourceStatus(db, 1)!).toMatchObject({
			lastCommit: 'abc',
			lastSyncedAt: '2026-10-01T10:00:00.000Z',
			error: 'git ls-remote failed',
			warnings: ['broken.md: unclosed include'],
			pages: [
				{ file: 'deploy.md', title: 'Title of deploy.md', snippets: 2, tokens: 35 },
				{ file: 'index.md', title: 'Title of index.md', snippets: 1, tokens: 5 }
			],
			totals: { pages: 2, snippets: 3, tokens: 40 },
			deadLinks: [
				{ file: 'deploy.md', anchor: 'rollback', target: 'auth/missing' },
				{ file: 'index.md', anchor: null, target: 'auth/deploy#nope' }
			]
		});
	});
});

describe('deadLinks', () => {
	it('lists the dead links of all sources with their source, or of one source', () => {
		const auth = insertPage(1, 'deploy.md', [{ anchor: null, tokens: 1 }]);
		const billing = insertPage(2, 'index.md', [{ anchor: null, tokens: 1 }]);
		insertLink(auth, 'rollback', 'auth/gone', true);
		insertLink(auth, null, 'auth/index', false);
		insertLink(billing, null, 'billing/old', true);

		expect(deadLinks(db)).toEqual([
			{
				sourceId: 1,
				source: 'auth',
				file: 'deploy.md',
				anchor: 'rollback',
				target: 'auth/gone'
			},
			{
				sourceId: 2,
				source: 'billing',
				file: 'index.md',
				anchor: null,
				target: 'billing/old'
			}
		]);
		expect(deadLinks(db, 2).map((link) => link.target)).toEqual(['billing/old']);
		expect(sourceStatus(db, 1)!.deadLinks).toEqual([
			{ file: 'deploy.md', anchor: 'rollback', target: 'auth/gone' }
		]);
	});
});

describe('sync history', () => {
	it('lists the runs of the source, newest first', () => {
		db.exec(`INSERT INTO sync_runs (source_id, started_at, finished_at, outcome, commit_hash, error, runs)
			VALUES (1, '2026-10-30T10:00:00.000Z', '2026-10-30T10:01:00.000Z', 'synced', 'abc', NULL, 1),
				(1, '2026-10-30T10:05:00.000Z', '2026-10-30T11:00:00.000Z', 'failed', NULL, 'denied', 12),
				(2, '2026-10-30T10:00:00.000Z', '2026-10-30T10:01:00.000Z', 'synced', 'def', NULL, 1)`);

		expect(sourceStatus(db, 1)!.history).toEqual([
			{
				startedAt: '2026-10-30T10:05:00.000Z',
				finishedAt: '2026-10-30T11:00:00.000Z',
				outcome: 'failed',
				commit: null,
				error: 'denied',
				runs: 12
			},
			{
				startedAt: '2026-10-30T10:00:00.000Z',
				finishedAt: '2026-10-30T10:01:00.000Z',
				outcome: 'synced',
				commit: 'abc',
				error: null,
				runs: 1
			}
		]);
	});
});

describe('previewPage', () => {
	it('lists the snippets in page order, each as the agent operation read returns it', () => {
		insertPage(1, 'guides/deploy.md', [
			{ anchor: null, tokens: 10 },
			{ anchor: 'rollback', tokens: 25 }
		]);

		const preview = previewPage(db, 'auth', 'guides/deploy.md');

		expect(preview?.map(({ id, titlePath, tokens }) => ({ id, titlePath, tokens }))).toEqual([
			{ id: 'auth/guides/deploy', titlePath: ['auth', 'Title'], tokens: 10 },
			{ id: 'auth/guides/deploy#rollback', titlePath: ['auth', 'Title'], tokens: 25 }
		]);
		expect(preview?.map((snippet) => snippet.markdown).join('\n\n')).toBe(
			readById(db, parseGrimoireId('auth/guides/deploy')!, 'all').markdown
		);
		expect(preview?.[1].markdown).toContain('Content of guides/deploy.md 1');
	});

	it('returns no snippets for a page without any, telling it apart from a missing page', () => {
		insertPage(1, 'empty.md', []);

		expect(previewPage(db, 'auth', 'empty.md')).toEqual([]);
	});

	it('returns undefined for a page the source does not have', () => {
		insertPage(2, 'other.md', [{ anchor: null, tokens: 1 }]);

		expect(previewPage(db, 'auth', 'other.md')).toBeUndefined();
		expect(previewPage(db, 'auth', 'other')).toBeUndefined();
	});
});

describe('dashboard', () => {
	beforeEach(() => {
		db.exec(`
			INSERT INTO sources (id, slug, name, git_url, branch, path, last_synced_at, error, warnings)
			VALUES
				(3, 'broken', 'Broken', 'https://git.example.com/b.git', 'main', '', '2026-10-28T10:00:00Z',
					'git ls-remote failed', '[]'),
				(4, 'noisy', 'Noisy', 'https://git.example.com/n.git', 'main', '', '2026-10-28T10:00:00Z',
					NULL, '["docs/a.md: skipped, bad front matter"]'),
				(5, 'fine', 'Fine', 'https://git.example.com/f.git', 'main', '', '2026-10-28T10:00:00Z',
					NULL, '[]');
			INSERT INTO api_keys (name, key_hash, all_sources) VALUES ('ci', 'hash-1', 1), ('bot', 'hash-2', 0);
		`);
		const deploy = insertPage(5, 'deploy.md', [
			{ anchor: null, tokens: 30 },
			{ anchor: 'rollback', tokens: 70 }
		]);
		insertPage(1, 'index.md', [{ anchor: null, tokens: 5 }]);
		insertLink(deploy, null, 'fine/gone', true);
		insertLink(deploy, null, 'fine/index', false);
	});

	it('adds up the figures of all sources and counts the API keys', () => {
		expect(dashboard(db).totals).toEqual({
			sources: 5,
			pages: 2,
			snippets: 3,
			tokens: 105,
			deadLinks: 1,
			apiKeys: 2
		});
	});

	it('lists the sources with an error, with warnings or never synced, but not one in sync', () => {
		expect(dashboard(db).attention).toEqual([
			{
				sourceId: 1,
				source: 'auth',
				lastSyncedAt: null,
				neverSynced: true,
				error: null,
				warnings: []
			},
			{
				sourceId: 2,
				source: 'billing',
				lastSyncedAt: null,
				neverSynced: true,
				error: null,
				warnings: []
			},
			{
				sourceId: 3,
				source: 'broken',
				lastSyncedAt: '2026-10-28T10:00:00Z',
				neverSynced: false,
				error: 'git ls-remote failed',
				warnings: []
			},
			{
				sourceId: 4,
				source: 'noisy',
				lastSyncedAt: '2026-10-28T10:00:00Z',
				neverSynced: false,
				error: null,
				warnings: ['docs/a.md: skipped, bad front matter']
			}
		]);
	});

	it('gives the sync state of every source, healthy ones included', () => {
		expect(
			sourceHealth(db).map(({ source, neverSynced, error, warnings }) => ({
				source,
				neverSynced,
				error,
				warnings: warnings.length
			}))
		).toEqual([
			{ source: 'auth', neverSynced: true, error: null, warnings: 0 },
			{ source: 'billing', neverSynced: true, error: null, warnings: 0 },
			{ source: 'broken', neverSynced: false, error: 'git ls-remote failed', warnings: 0 },
			{ source: 'fine', neverSynced: false, error: null, warnings: 0 },
			{ source: 'noisy', neverSynced: false, error: null, warnings: 1 }
		]);
		expect(sourceHealth(db).filter(needsAttention)).toEqual(dashboard(db).attention);
	});

	it('lists the sources with the figures of the public start page', () => {
		expect(dashboard(db).sources.map((source) => [source.slug, source.pages])).toEqual([
			['auth', 1],
			['billing', 0],
			['broken', 0],
			['fine', 1],
			['noisy', 0]
		]);
	});
});
