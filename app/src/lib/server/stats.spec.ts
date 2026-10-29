import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from './db/schema';
import { projectStats } from './stats';

let db: DatabaseSync;

function insert(sql: string, ...values: (string | number | null)[]): number {
	return Number(db.prepare(sql).run(...values).lastInsertRowid);
}

function addSource(
	projectId: number,
	slug: string,
	lastSyncedAt: string | null,
	error: string | null = null
) {
	return insert(
		`INSERT INTO sources (project_id, slug, git_url, branch, path, username, last_synced_at, error)
		VALUES (?, ?, 'https://git.example/secret-repo.git', 'release', 'internal/docs', 'deploy-bot', ?, ?)`,
		projectId,
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
	insert(`INSERT INTO links (page_id, target, dead) VALUES (?, 'p/s/alive', 0)`, pageId);
	for (let i = 0; i < deadLinks; i++) {
		insert(`INSERT INTO links (page_id, target, dead) VALUES (?, 'p/s/gone', 1)`, pageId);
	}
}

beforeEach(() => {
	db = openDatabase(':memory:');
});

describe('projectStats', () => {
	it('sums sources, pages, snippets, tokens and dead links of a project', () => {
		const project = insert(`INSERT INTO projects (slug, description) VALUES ('platform', 'Login')`);
		const auth = addSource(project, 'auth', '2026-10-28T10:00:00.000Z');
		const gateway = addSource(project, 'gateway', '2026-10-27T08:00:00.000Z');
		addPage(auth, 'deploy.md', [100, 200], 2);
		addPage(auth, 'index.md', [50]);
		addPage(gateway, 'index.md', [10], 1);

		expect(projectStats(db)).toEqual([
			{
				slug: 'platform',
				description: 'Login',
				sources: 2,
				pages: 3,
				snippets: 4,
				tokens: 360,
				oldestSync: '2026-10-27T08:00:00.000Z',
				sourcesWithError: 0,
				deadLinks: 3
			}
		]);
	});

	it('shows a project without sources with zeros and no sync', () => {
		insert(`INSERT INTO projects (slug) VALUES ('empty')`);
		expect(projectStats(db)).toEqual([
			{
				slug: 'empty',
				description: '',
				sources: 0,
				pages: 0,
				snippets: 0,
				tokens: 0,
				oldestSync: null,
				sourcesWithError: 0,
				deadLinks: 0
			}
		]);
	});

	it('has no oldest sync while a source was never synced, and counts failed sources', () => {
		const project = insert(`INSERT INTO projects (slug) VALUES ('billing')`);
		addSource(project, 'synced', '2026-10-28T10:00:00.000Z');
		addSource(project, 'new', null);
		addSource(project, 'broken', '2026-10-28T11:00:00.000Z', 'fatal: repository not found');

		expect(projectStats(db)[0]).toMatchObject({
			sources: 3,
			oldestSync: null,
			sourcesWithError: 1
		});
	});

	it('returns no detail of a source', () => {
		const project = insert(`INSERT INTO projects (slug) VALUES ('platform')`);
		addSource(project, 'auth', null, 'fatal: could not read from git.internal.example');

		const shown = JSON.stringify(projectStats(db));
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
