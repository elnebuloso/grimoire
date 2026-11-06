import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from './db/schema';
import { sourceStats } from './stats';

let db: DatabaseSync;

function insert(sql: string, ...values: (string | number | null)[]): number {
	return Number(db.prepare(sql).run(...values).lastInsertRowid);
}

function addSource(slug: string, lastSyncedAt: string | null, error: string | null = null) {
	return insert(
		`INSERT INTO sources (slug, name, description, git_url, branch, path, username, last_synced_at, error)
		VALUES (?, 'Name', 'Login', 'https://git.example/secret-repo.git', 'release', 'internal/docs', 'deploy-bot', ?, ?)`,
		slug,
		lastSyncedAt,
		error
	);
}

function addPage(sourceId: number, file: string, tokens: number[], deadLinks = 0) {
	const pageId = insert(
		`INSERT INTO pages (source_id, file, title, content) VALUES (?, ?, 'Title', '# Title')`,
		sourceId,
		file
	);
	tokens.forEach((count, position) =>
		insert(
			`INSERT INTO snippets (page_id, position, title_path, content, tokens) VALUES (?, ?, '[]', '', ?)`,
			pageId,
			position,
			count
		)
	);
	insert(`INSERT INTO links (page_id, target, dead) VALUES (?, 's/alive', 0)`, pageId);
	for (let i = 0; i < deadLinks; i++) {
		insert(`INSERT INTO links (page_id, target, dead) VALUES (?, 's/gone', 1)`, pageId);
	}
}

beforeEach(() => {
	db = openDatabase(':memory:');
});

describe('sourceStats', () => {
	it('counts pages, snippets, tokens, dead links and warnings per source, with its visibility', () => {
		const auth = addSource('auth-docs', '2026-10-28T10:00:00.000Z');
		const gateway = addSource('gateway-docs', '2026-10-27T08:00:00.000Z');
		addPage(auth, 'deploy.md', [100, 200], 2);
		addPage(auth, 'index.md', [50]);
		addPage(gateway, 'index.md', [10], 1);
		db.prepare(
			`UPDATE sources SET visibility = 'public', warnings = '["index.md: include shared.md not found"]' WHERE id = ?`
		).run(gateway);

		expect(sourceStats(db)).toEqual([
			{
				id: auth,
				slug: 'auth-docs',
				name: 'Name',
				description: 'Login',
				visibility: 'internal',
				docsUrl: null,
				pages: 2,
				snippets: 3,
				tokens: 350,
				lastSync: '2026-10-28T10:00:00.000Z',
				lastCheck: null,
				error: false,
				paused: false,
				deadLinks: 2,
				warnings: 0
			},
			{
				id: gateway,
				slug: 'gateway-docs',
				name: 'Name',
				description: 'Login',
				visibility: 'public',
				docsUrl: null,
				pages: 1,
				snippets: 1,
				tokens: 10,
				lastSync: '2026-10-27T08:00:00.000Z',
				lastCheck: null,
				error: false,
				paused: false,
				deadLinks: 1,
				warnings: 1
			}
		]);
	});

	it('shows a source never synced with zeros, and a failed one as an error', () => {
		addSource('new-docs', null);
		addSource('broken-docs', '2026-10-28T11:00:00.000Z', 'fatal: repository not found');

		expect(
			sourceStats(db).map(({ slug, pages, tokens, lastSync, error }) => ({
				slug,
				pages,
				tokens,
				lastSync,
				error
			}))
		).toEqual([
			{
				slug: 'broken-docs',
				pages: 0,
				tokens: 0,
				lastSync: '2026-10-28T11:00:00.000Z',
				error: true
			},
			{ slug: 'new-docs', pages: 0, tokens: 0, lastSync: null, error: false }
		]);
	});

	it('gives the last run as lastCheck, also when it found nothing new to index', () => {
		const source = addSource('auth-docs', '2026-11-02T10:42:00.000Z');
		db.prepare('UPDATE sources SET last_checked_at = ? WHERE id = ?').run(
			'2026-11-04T09:20:00.000Z',
			source
		);

		expect(sourceStats(db)[0]).toMatchObject({
			lastSync: '2026-11-02T10:42:00.000Z',
			lastCheck: '2026-11-04T09:20:00.000Z'
		});
	});

	it('gives the documentation URL of public sources only', () => {
		const open = addSource('open-docs', null);
		const closed = addSource('closed-docs', null);
		const setDocs = db.prepare('UPDATE sources SET docs_url = ?, visibility = ? WHERE id = ?');
		setDocs.run('https://docs.example.com/open/', 'public', open);
		setDocs.run('https://docs.internal.example/closed/', 'internal', closed);

		expect(sourceStats(db).map(({ slug, docsUrl }) => ({ slug, docsUrl }))).toEqual([
			{ slug: 'closed-docs', docsUrl: null },
			{ slug: 'open-docs', docsUrl: 'https://docs.example.com/open/' }
		]);
	});

	it('returns no detail of a source', () => {
		addSource('auth-docs', null, 'fatal: could not read from git.internal.example');

		const shown = JSON.stringify(sourceStats(db));
		for (const detail of [
			'secret-repo',
			'release',
			'internal/docs',
			'deploy-bot',
			'git.internal'
		]) {
			expect(shown).not.toContain(detail);
		}
	});
});
