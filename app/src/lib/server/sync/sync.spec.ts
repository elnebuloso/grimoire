import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import { splitCode } from '../db/sources';
import { encryptToken } from '../token-encryption';
import { syncSource } from './sync';

const key = Buffer.alloc(32, 7);
const filler = 'Some words to keep this section above the merge threshold. '.repeat(6);

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

function commitFiles(files: Record<string, string | null>) {
	const clone = mkdtempSync(join(root, 'edit-'));
	git(root, 'clone', '--quiet', bare, clone);
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

function addSource(url: string, options: { exclusions?: string[]; token?: string } = {}) {
	const project = Number(
		db
			.prepare(
				"INSERT INTO projects (slug) VALUES ('platform') ON CONFLICT DO UPDATE SET slug = slug RETURNING id"
			)
			.get()!.id
	);
	return Number(
		db
			.prepare(
				`INSERT INTO sources (project_id, slug, git_url, branch, path, exclusions, username, encrypted_token)
				VALUES (?, ?, ?, 'main', 'docs/', ?, 'deploy', ?)`
			)
			.run(
				project,
				`auth-${Math.random().toString(36).slice(2)}`,
				url,
				JSON.stringify(options.exclusions ?? []),
				options.token ? encryptToken(options.token, key) : null
			).lastInsertRowid
	);
}

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'grimoire-sync-test-'));
	work = join(root, 'work');
	mkdirSync(work);
	bare = join(root, 'auth.git');
	git(root, 'init', '--quiet', '--bare', '--initial-branch=main', bare);
	// Lets the blob-less clone work over file://, as Git hosting servers allow by default.
	git(bare, 'config', 'uploadpack.allowFilter', 'true');
	commitFiles({
		'docs/deploy.md': `# Deploy\n\n## Rollback\n\n${filler}\n\n\`\`\`bash\nmake rollback\n\`\`\`\n\n--8<-- "shared/warning.md"\n`,
		'docs/index.md': `# Home\n\nSee [rollback](deploy.md#rollback) and [gone](missing.md).\n`,
		'docs/broken.md': '---\ntitle: [unclosed\n---\n# Broken\n',
		'docs/drafts/wip.md': '# Work in progress\n',
		'shared/warning.md': '!!! warning "Careful"\n    Migrations are not rolled back.\n',
		'src/app.ts': 'export {};\n'
	});
	// A file, not memory: the index is written by a worker thread with its own connection.
	db = openDatabase(join(root, 'grimoire.db'));
	source = addSource(`file://${bare}`, { exclusions: ['docs/drafts/**'] });
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
			{ target: expect.stringMatching(/\/deploy#rollback$/), dead: 0 },
			{ target: expect.stringMatching(/\/missing$/), dead: 1 }
		]);

		const [state] = rows('SELECT last_commit, error, warnings FROM sources WHERE id = ?', source);
		expect(state.last_commit).toBe(git(bare, 'rev-parse', 'main').trim());
		expect(state.error).toBeNull();
		expect(JSON.parse(state.warnings as string)).toEqual([
			expect.stringMatching(/^docs\/broken.md: skipped, /)
		]);
		expect(readdirSync(work)).toEqual([]);
	});

	it('stores the position of each page in the nav of the site config at the repository root', async () => {
		commitFiles({
			'mkdocs.yml': 'docs_dir: docs\nnav:\n  - Deploy: deploy.md\n  - Home: index.md\n'
		});
		await syncSource(db, source, { key, workDirectory: work });

		expect(rows('SELECT file, nav_position FROM pages ORDER BY file')).toEqual([
			{ file: 'deploy.md', nav_position: 0 },
			{ file: 'index.md', nav_position: 1 }
		]);
	});

	it('builds heading IDs with the slug function of the site config', async () => {
		commitFiles({
			'mkdocs.yml':
				'markdown_extensions:\n  - toc:\n      slugify: !!python/object/apply:pymdownx.slugs.slugify\n        kwds:\n          case: lower\n',
			'docs/index.md': '# Home\n\n## Größe & Gewicht\n\nText.\n'
		});
		await syncSource(db, source, { key, workDirectory: work });

		// The short section is merged into the overview, which keeps its ID as an alias.
		expect(rows("SELECT aliases FROM snippets WHERE aliases != '[]'")).toEqual([
			{ aliases: '["größe--gewicht"]' }
		]);
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

	it('keeps the last good index and stores the error when a sync fails', async () => {
		await syncSource(db, source, { key, workDirectory: work });
		rmSync(bare, { recursive: true });

		const result = await syncSource(db, source, { key, workDirectory: work });
		expect(result.status).toBe('failed');
		expect(rows('SELECT count(*) AS n FROM pages')).toEqual([{ n: 2 }]);
		const [state] = rows('SELECT error FROM sources WHERE id = ?', source);
		expect(state.error).toMatch(/git ls-remote failed/);
		expect(readdirSync(work)).toEqual([]);
	});

	it('keeps the last good index when writing the new one fails in the worker', async () => {
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

	it('records when every check started, whether it synced, found nothing new or failed', async () => {
		const checkedAt = () =>
			new Date(
				rows('SELECT last_checked_at FROM sources WHERE id = ?', source)[0]
					.last_checked_at as string
			);
		const expectCheckedDuring = async (sync: () => Promise<unknown>) => {
			const before = new Date();
			await sync();
			const after = new Date();
			expect(checkedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(checkedAt().getTime()).toBeLessThanOrEqual(after.getTime());
		};

		await expectCheckedDuring(() => syncSource(db, source, { key, workDirectory: work }));
		await expectCheckedDuring(() => syncSource(db, source, { key, workDirectory: work }));
		rmSync(bare, { recursive: true });
		await expectCheckedDuring(() => syncSource(db, source, { key, workDirectory: work }));
	});

	it('never stores the access token, not even in an error', async () => {
		const token = 'glpat-very-secret-token';
		const withToken = addSource(`https://deploy:${token}@127.0.0.1:9/auth.git`, { token });

		const result = await syncSource(db, withToken, { key, workDirectory: work });
		expect(result.status).toBe('failed');
		const [state] = rows('SELECT error, encrypted_token FROM sources WHERE id = ?', withToken);
		expect(state.error).not.toContain(token);
		expect(state.error).not.toContain(Buffer.from(`deploy:${token}`).toString('base64'));
		expect(state.encrypted_token).not.toContain(token);
	});

	it('reports a wrong encryption key as an error of the source', async () => {
		const withToken = addSource(`file://${bare}`, { token: 'secret' });
		const result = await syncSource(db, withToken, {
			key: Buffer.alloc(32, 9),
			workDirectory: work
		});
		expect(result).toMatchObject({
			status: 'failed',
			error: expect.stringMatching(/TOKEN_ENCRYPTION_KEY/)
		});
	});
});

describe('splitCode', () => {
	it('separates code blocks from prose', () => {
		expect(splitCode('Roll back:\n\n```bash\nmake rollback\n```\n\nThen `check`.\n')).toEqual({
			text: 'Roll back:\nThen check.',
			code: 'make rollback'
		});
	});
});
