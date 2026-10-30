import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import { readById } from '../agent/operations';
import { parseGrimoireId } from '../grimoire-id';
import { dashboard, previewPage, sourceStatus } from './status';

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
		INSERT INTO projects (id, slug) VALUES (1, 'platform');
		INSERT INTO sources (id, project_id, slug, git_url, branch, path)
		VALUES (1, 1, 'auth', 'https://git.example.com/auth.git', 'main', 'docs/'),
			(2, 1, 'billing', 'https://git.example.com/billing.git', 'main', 'docs/');
	`);
});

describe('sourceStatus', () => {
	it('reports a source that was never synced', () => {
		expect(sourceStatus(db, 1)).toEqual({
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
		insertLink(deploy, 'rollback', 'platform/auth/missing', true);
		insertLink(index, null, 'platform/auth/deploy#nope', true);
		insertLink(index, null, 'platform/auth/deploy', false);
		db.prepare(
			`UPDATE sources SET last_commit = 'abc', last_synced_at = '2026-10-01T10:00:00.000Z',
				error = 'git ls-remote failed', warnings = '["broken.md: unclosed include"]'
			WHERE id = 1`
		).run();

		expect(sourceStatus(db, 1)).toMatchObject({
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
				{ file: 'deploy.md', anchor: 'rollback', target: 'platform/auth/missing' },
				{ file: 'index.md', anchor: null, target: 'platform/auth/deploy#nope' }
			]
		});
	});
});

describe('sync history', () => {
	it('lists the runs of the source, newest first', () => {
		db.exec(`INSERT INTO sync_runs (source_id, started_at, finished_at, outcome, commit_hash, error, runs)
			VALUES (1, '2026-10-30T10:00:00.000Z', '2026-10-30T10:01:00.000Z', 'synced', 'abc', NULL, 1),
				(1, '2026-10-30T10:05:00.000Z', '2026-10-30T11:00:00.000Z', 'failed', NULL, 'denied', 12),
				(2, '2026-10-30T10:00:00.000Z', '2026-10-30T10:01:00.000Z', 'synced', 'def', NULL, 1)`);

		expect(sourceStatus(db, 1).history).toEqual([
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

		const preview = previewPage(db, 'platform', 'auth', 'guides/deploy.md');

		expect(preview?.map(({ id, titlePath, tokens }) => ({ id, titlePath, tokens }))).toEqual([
			{ id: 'platform/auth/guides/deploy', titlePath: ['platform', 'auth', 'Title'], tokens: 10 },
			{
				id: 'platform/auth/guides/deploy#rollback',
				titlePath: ['platform', 'auth', 'Title'],
				tokens: 25
			}
		]);
		expect(preview?.map((snippet) => snippet.markdown).join('\n\n')).toBe(
			readById(db, parseGrimoireId('platform/auth/guides/deploy')!, 'all').markdown
		);
		expect(preview?.[1].markdown).toContain('Content of guides/deploy.md 1');
	});

	it('returns no snippets for a page without any, telling it apart from a missing page', () => {
		insertPage(1, 'empty.md', []);

		expect(previewPage(db, 'platform', 'auth', 'empty.md')).toEqual([]);
	});

	it('returns undefined for a page the source does not have', () => {
		insertPage(2, 'other.md', [{ anchor: null, tokens: 1 }]);

		expect(previewPage(db, 'platform', 'auth', 'other.md')).toBeUndefined();
		expect(previewPage(db, 'platform', 'auth', 'other')).toBeUndefined();
	});
});

describe('dashboard', () => {
	beforeEach(() => {
		db.exec(`
			INSERT INTO projects (id, slug) VALUES (2, 'docs');
			INSERT INTO sources (id, project_id, slug, git_url, branch, path, last_synced_at, error, warnings)
			VALUES
				(3, 2, 'broken', 'https://git.example.com/b.git', 'main', '', '2026-10-28T10:00:00Z',
					'git ls-remote failed', '[]'),
				(4, 2, 'noisy', 'https://git.example.com/n.git', 'main', '', '2026-10-28T10:00:00Z',
					NULL, '["docs/a.md: skipped, bad front matter"]'),
				(5, 2, 'fine', 'https://git.example.com/f.git', 'main', '', '2026-10-28T10:00:00Z',
					NULL, '[]');
			INSERT INTO api_keys (name, key_hash, all_projects) VALUES ('ci', 'hash-1', 1), ('bot', 'hash-2', 0);
		`);
		const deploy = insertPage(5, 'deploy.md', [
			{ anchor: null, tokens: 30 },
			{ anchor: 'rollback', tokens: 70 }
		]);
		insertPage(1, 'index.md', [{ anchor: null, tokens: 5 }]);
		insertLink(deploy, null, 'docs/fine/gone', true);
		insertLink(deploy, null, 'docs/fine/index', false);
	});

	it('adds up the figures of all projects and counts the API keys', () => {
		expect(dashboard(db).totals).toEqual({
			projects: 2,
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
				projectId: 2,
				project: 'docs',
				sourceId: 3,
				source: 'broken',
				neverSynced: false,
				error: 'git ls-remote failed',
				warnings: []
			},
			{
				projectId: 2,
				project: 'docs',
				sourceId: 4,
				source: 'noisy',
				neverSynced: false,
				error: null,
				warnings: ['docs/a.md: skipped, bad front matter']
			},
			{
				projectId: 1,
				project: 'platform',
				sourceId: 1,
				source: 'auth',
				neverSynced: true,
				error: null,
				warnings: []
			},
			{
				projectId: 1,
				project: 'platform',
				sourceId: 2,
				source: 'billing',
				neverSynced: true,
				error: null,
				warnings: []
			}
		]);
	});

	it('lists the projects with the figures of the public start page', () => {
		expect(dashboard(db).projects.map((project) => [project.slug, project.pages])).toEqual([
			['docs', 1],
			['platform', 1]
		]);
	});
});
