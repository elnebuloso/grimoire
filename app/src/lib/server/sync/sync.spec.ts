import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import { createLimiter } from '../limiter';
import type { SyncLanes } from './queue';
import { syncSource } from './sync';

// Include resolution belongs in the indexing child process, which loads its own copy from disk; in
// the server process, which these mocks replace, a docs branch could exhaust the server's memory.
vi.mock('../parsing/include', () => ({
	resolveIncludes: () => {
		throw new Error('includes resolved on the server thread');
	}
}));

// Every sync clones with real Git and indexes in a child process; under the load of the whole
// test run that takes seconds, not the default 5 s at most.
vi.setConfig({ testTimeout: 30_000 });

const key = Buffer.alloc(32, 7);
const filler = 'Some words to keep this section above the merge threshold. '.repeat(6);

// The repository every test starts from, built once: Git takes most of the time of a test.
let template: string;
let root: string;
let work: string;
let db: DatabaseSync;
let bare: string;
let source: number;

// Pinned so the user's git configuration (signing, hooks, default branch) cannot change the test.
function git(cwd: string, ...args: string[]) {
	return execFileSync(
		'git',
		[
			'-c',
			'user.name=test',
			'-c',
			'user.email=test@example.com',
			'-c',
			'commit.gpgsign=false',
			'-c',
			'core.hooksPath=/dev/null',
			...args
		],
		{
			cwd,
			encoding: 'utf8',
			env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' }
		}
	);
}

function commitFiles(files: Record<string, string | null>, repository = bare) {
	const clone = mkdtempSync(join(root, 'edit-'));
	git(root, 'clone', '--quiet', repository, clone);
	for (const [path, content] of Object.entries(files)) {
		if (content === null) {
			rmSync(join(clone, path));
			continue;
		}
		mkdirSync(dirname(join(clone, path)), { recursive: true });
		writeFileSync(join(clone, path), content);
	}
	git(clone, 'add', '--all');
	git(clone, 'commit', '--quiet', '-m', 'change');
	git(clone, 'push', '--quiet', 'origin', 'main');
	rmSync(clone, { recursive: true });
}

function rows(sql: string, ...values: (string | number)[]) {
	return db
		.prepare(sql)
		.all(...values)
		.map((row) => ({ ...row }));
}

function addSource(url: string, exclusions: string[]) {
	return Number(
		db
			.prepare(
				`INSERT INTO sources (slug, name, git_url, branch, path, exclusions)
				VALUES (?, 'Docs', ?, 'main', 'docs/', ?)`
			)
			.run(`auth-${Math.random().toString(36).slice(2)}`, url, JSON.stringify(exclusions))
			.lastInsertRowid
	);
}

beforeAll(() => {
	root = mkdtempSync(join(tmpdir(), 'grimoire-sync-template-'));
	template = join(root, 'auth.git');
	git(root, 'init', '--quiet', '--bare', '--initial-branch=main', template);
	// Lets the blob-less clone work over file://, as Git hosting servers allow by default.
	git(template, 'config', 'uploadpack.allowFilter', 'true');
	commitFiles(
		{
			'docs/deploy.md': `# Deploy\n\n## Rollback\n\n${filler}\n\n\`\`\`bash\nmake rollback\n\`\`\`\n\n--8<-- "shared/warning.md"\n`,
			'docs/index.md': `# Home\n\nSee [rollback](deploy.md#rollback) and [gone](missing.md).\n`,
			'docs/broken.md': '---\ntitle: [unclosed\n---\n# Broken\n',
			'docs/drafts/wip.md': '# Work in progress\n',
			'shared/warning.md': '!!! warning "Careful"\n    Migrations are not rolled back.\n',
			'src/app.ts': 'export {};\n'
		},
		template
	);
});

afterAll(() => rmSync(dirname(template), { recursive: true, force: true }));

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'grimoire-sync-test-'));
	work = join(root, 'work');
	mkdirSync(work);
	bare = join(root, 'auth.git');
	cpSync(template, bare, { recursive: true });
	// A file, not memory: the index is written by the indexing child process with its own connection.
	db = openDatabase(join(root, 'grimoire.db'));
	source = addSource(`file://${bare}`, ['docs/drafts/**']);
});

afterEach(() => {
	db.close();
	rmSync(root, { recursive: true, force: true });
});

describe('syncSource', () => {
	it('indexes pages with resolved includes and links, skipping excluded and broken pages', async () => {
		const result = await syncSource(db, source, { key, workDirectory: work });

		expect(result).toMatchObject({ status: 'synced', pages: 2 });
		expect(rows('SELECT file FROM pages ORDER BY file')).toEqual([
			{ file: 'deploy.md' },
			{ file: 'index.md' }
		]);
		const [rollback] = rows("SELECT content FROM snippets WHERE anchor = 'rollback'");
		expect(rollback.content).toContain('> **Careful:** Migrations are not rolled back.');
		expect(
			rows("SELECT rowid FROM snippets_fts WHERE snippets_fts MATCH 'code:rollback'")
		).toHaveLength(1);
		expect(rows('SELECT target, dead FROM links ORDER BY target')).toEqual([
			{ target: 'deploy#rollback', dead: 0 },
			{ target: 'missing', dead: 1 }
		]);

		const [state] = rows('SELECT last_commit, error, warnings FROM sources WHERE id = ?', source);
		expect(state.last_commit).toBe(git(bare, 'rev-parse', 'main').trim());
		expect(state.error).toBeNull();
		expect(JSON.parse(state.warnings as string)).toEqual([
			expect.stringMatching(/^docs\/broken.md: skipped, /)
		]);
		expect(readdirSync(work)).toEqual([]);
	});

	it('skips an unchanged branch and replaces the index after a new commit', async () => {
		await syncSource(db, source, { key, workDirectory: work });
		expect(await syncSource(db, source, { key, workDirectory: work })).toMatchObject({
			status: 'unchanged'
		});

		commitFiles({ 'docs/index.md': null, 'docs/new.md': '# New\n' });
		expect(await syncSource(db, source, { key, workDirectory: work })).toMatchObject({
			status: 'synced'
		});
		expect(rows('SELECT file FROM pages ORDER BY file')).toEqual([
			{ file: 'deploy.md' },
			{ file: 'new.md' }
		]);
	});

	it('keeps the last good index when writing the new one fails in the indexing process', async () => {
		await syncSource(db, source, { key, workDirectory: work });
		commitFiles({ 'docs/index.md': '# Home again\n' });
		db.exec(`CREATE TRIGGER refuse_pages BEFORE INSERT ON pages
			BEGIN SELECT RAISE(ABORT, 'disk is full'); END`);

		const result = await syncSource(db, source, { key, workDirectory: work });

		expect(result).toMatchObject({ status: 'failed', error: 'disk is full' });
		expect(rows('SELECT title FROM pages ORDER BY file')).toEqual([
			{ title: 'Deploy' },
			{ title: 'Home' }
		]);
		expect(rows('SELECT error FROM sources WHERE id = ?', source)).toEqual([
			{ error: 'disk is full' }
		]);
	});

	it('fails a sync whose indexing outlasts the deadline and frees the sync slot', async () => {
		const lanes: SyncLanes = { check: createLimiter(1), sync: createLimiter(1) };

		// No indexing process starts, reads a checkout and writes an index within a millisecond.
		const result = await syncSource(db, source, {
			key,
			workDirectory: work,
			lanes,
			indexingDeadlineMs: 1
		});

		expect(result).toEqual({
			status: 'failed',
			error: 'indexing took longer than 0.001 seconds',
			commit: git(bare, 'rev-parse', 'main').trim()
		});
		expect(rows('SELECT error FROM sources WHERE id = ?', source)).toEqual([
			{ error: 'indexing took longer than 0.001 seconds' }
		]);
		expect(
			await syncSource(db, source, { key, workDirectory: work, lanes, force: true })
		).toMatchObject({ status: 'synced', pages: 2 });
	});

	it('fails a sync whose indexing runs out of memory and keeps syncing other sources', async () => {
		const sections = Array.from({ length: 10_000 }, (_, i) => `## Section ${i}\n\n${filler}`);
		commitFiles({ 'docs/huge.md': `# Huge\n\n${sections.join('\n\n')}` });

		const exhausted = await syncSource(db, source, {
			key,
			workDirectory: work,
			indexingHeapMb: 32
		});

		expect(exhausted).toEqual({
			status: 'failed',
			error: expect.stringMatching(/^indexing ended with .+ before it finished, out of memory/),
			commit: git(bare, 'rev-parse', 'main').trim()
		});
		const other = addSource(`file://${bare}`, ['docs/huge.md', 'docs/drafts/**']);
		expect(
			await syncSource(db, other, { key, workDirectory: work, indexingHeapMb: 32 })
		).toMatchObject({ status: 'synced', pages: 2 });
	});
});

describe('deleting a source while it syncs', () => {
	it('leaves nothing behind when the source is deleted before the sync stage', async () => {
		// The indexing process then writes into a source that no longer exists.
		const lanes: SyncLanes = {
			check: (run) => run(),
			sync: (run) => {
				db.prepare('DELETE FROM sources').run();
				return run();
			}
		};

		const outcome = await syncSource(db, source, { key, workDirectory: work, lanes });

		expect(outcome.status).toBe('failed');
		expect({
			pages: rows('SELECT id FROM pages').length,
			snippets: rows('SELECT id FROM snippets').length,
			links: rows('SELECT target FROM links').length,
			runs: rows('SELECT id FROM sync_runs').length
		}).toEqual({ pages: 0, snippets: 0, links: 0, runs: 0 });
	});
});
