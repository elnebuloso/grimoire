import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync
} from 'node:fs';
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
// Fixture repositories are local; the server itself never allows them.
const LOCAL = { allowedHosts: [], proxy: false, allowLocal: true };
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

function commitFiles(files: Record<string, string | null | { link: string }>, repository = bare) {
	const clone = mkdtempSync(join(root, 'edit-'));
	git(root, 'clone', '--quiet', repository, clone);
	for (const [path, content] of Object.entries(files)) {
		if (content === null) {
			rmSync(join(clone, path));
			continue;
		}
		mkdirSync(dirname(join(clone, path)), { recursive: true });
		if (typeof content === 'string') writeFileSync(join(clone, path), content);
		else symlinkSync(content.link, join(clone, path));
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
		const result = await syncSource(db, source, { key, policy: LOCAL, workDirectory: work });

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

	it('syncs a path and includes from directories whose names Git reads as patterns', async () => {
		commitFiles({
			'content/[lang]/index.md': '# Start\n\n--8<-- "shared/[v2]/note.md"\n',
			'shared/[v2]/note.md': 'Rollback takes ten minutes.\n'
		});
		db.prepare("UPDATE sources SET path = 'content/[lang]' WHERE id = ?").run(source);

		const result = await syncSource(db, source, { key, policy: LOCAL, workDirectory: work });

		expect(result).toMatchObject({ status: 'synced', pages: 1, warnings: [] });
		expect(rows('SELECT content FROM snippets')).toEqual([
			{ content: expect.stringContaining('Rollback takes ten minutes.') }
		]);
	});

	it('follows symlinks from the source path into the rest of the repository', async () => {
		commitFiles({
			'docs/runbooks': { link: '../ops/runbooks' },
			'docs/oncall.md': { link: '../ops/oncall.md' },
			'ops/runbooks/restart.md': '# Restart\n\nRestart the gateway.\n',
			'ops/oncall.md': '# On call\n\nPage the platform team.\n',
			'handbook/index.md': '# Handbook\n',
			site: { link: 'handbook' }
		});

		const result = await syncSource(db, source, { key, policy: LOCAL, workDirectory: work });

		expect(result).toMatchObject({ status: 'synced' });
		expect(
			rows("SELECT file FROM pages WHERE file IN ('oncall.md', 'runbooks/restart.md')")
		).toEqual([{ file: 'oncall.md' }, { file: 'runbooks/restart.md' }]);
		db.prepare("UPDATE sources SET path = 'site', last_commit = NULL WHERE id = ?").run(source);
		expect(await syncSource(db, source, { key, policy: LOCAL, workDirectory: work })).toMatchObject(
			{
				status: 'synced',
				pages: 1
			}
		);
	});

	it('skips an unchanged branch and replaces the index after a new commit', async () => {
		await syncSource(db, source, { key, policy: LOCAL, workDirectory: work });
		expect(await syncSource(db, source, { key, policy: LOCAL, workDirectory: work })).toMatchObject(
			{
				status: 'unchanged'
			}
		);

		commitFiles({ 'docs/index.md': null, 'docs/new.md': '# New\n' });
		expect(await syncSource(db, source, { key, policy: LOCAL, workDirectory: work })).toMatchObject(
			{
				status: 'synced'
			}
		);
		expect(rows('SELECT file FROM pages ORDER BY file')).toEqual([
			{ file: 'deploy.md' },
			{ file: 'new.md' }
		]);
	});

	it('keeps the last good index when writing the new one fails in the indexing process', async () => {
		await syncSource(db, source, { key, policy: LOCAL, workDirectory: work });
		commitFiles({ 'docs/index.md': '# Home again\n' });
		db.exec(`CREATE TRIGGER refuse_pages BEFORE INSERT ON pages
			BEGIN SELECT RAISE(ABORT, 'disk is full'); END`);

		const result = await syncSource(db, source, { key, policy: LOCAL, workDirectory: work });

		expect(result).toMatchObject({ status: 'failed', error: 'disk is full' });
		expect(rows('SELECT title FROM pages ORDER BY file')).toEqual([
			{ title: 'Deploy' },
			{ title: 'Home' }
		]);
		expect(rows('SELECT error FROM sources WHERE id = ?', source)).toEqual([
			{ error: 'disk is full' }
		]);
	});

	it('records the kind the indexing process found, with the error and the run', async () => {
		db.prepare("UPDATE sources SET path = 'archive/docs' WHERE id = ?").run(source);

		const result = await syncSource(db, source, { key, policy: LOCAL, workDirectory: work });

		expect(result).toMatchObject({ status: 'failed', kind: 'path' });
		expect(rows('SELECT error_kind FROM sources WHERE id = ?', source)).toEqual([
			{ error_kind: 'path' }
		]);
		expect(rows('SELECT error_kind FROM sync_runs WHERE source_id = ?', source)).toEqual([
			{ error_kind: 'path' }
		]);
	});

	it('fails a sync whose indexing outlasts the deadline and frees the sync slot', async () => {
		const lanes: SyncLanes = { check: createLimiter(1), sync: createLimiter(1) };

		// No indexing process starts, reads a checkout and writes an index within a millisecond.
		const result = await syncSource(db, source, {
			key,
			policy: LOCAL,
			workDirectory: work,
			lanes,
			indexingDeadlineMs: 1
		});

		expect(result).toEqual({
			status: 'failed',
			error: 'indexing took longer than 0.001 seconds',
			kind: 'deadline',
			commit: git(bare, 'rev-parse', 'main').trim()
		});
		expect(rows('SELECT error FROM sources WHERE id = ?', source)).toEqual([
			{ error: 'indexing took longer than 0.001 seconds' }
		]);
		expect(
			await syncSource(db, source, { key, policy: LOCAL, workDirectory: work, lanes, force: true })
		).toMatchObject({ status: 'synced', pages: 2 });
	});

	it('stops the indexing process and what it started when the server exits', async () => {
		const script = join(root, 'hanging-worker.mjs');
		const pidFile = join(root, 'child.pid');
		writeFileSync(
			script,
			`import { spawn } from 'node:child_process';
			import { writeFileSync } from 'node:fs';
			process.once('message', () => {
				const child = spawn('sleep', ['60'], { stdio: 'ignore' });
				writeFileSync(${JSON.stringify(pidFile)}, String(child.pid));
			});`
		);
		const running = (pid: number) => {
			try {
				process.kill(pid, 0);
				return true;
			} catch {
				return false;
			}
		};
		const result = syncSource(db, source, {
			key,
			policy: LOCAL,
			workDirectory: work,
			indexingDeadlineMs: 20_000,
			indexingScript: script
		});
		await vi.waitFor(() => expect(existsSync(pidFile)).toBe(true), { timeout: 10_000 });
		const pid = Number(readFileSync(pidFile, 'utf8'));
		try {
			// The listeners of a server process that exits, without ending the test runner.
			process.emit('exit', 0);
			await vi.waitFor(() => expect(running(pid)).toBe(false), { timeout: 5000 });
			expect(await result).toMatchObject({ status: 'failed', kind: 'aborted' });
		} finally {
			if (running(pid)) process.kill(pid, 'SIGKILL');
		}
	});

	it('stops the processes the indexing process started when it outlasts the deadline', async () => {
		// A stand-in for the indexing process that starts a child, as it starts git, and never answers.
		const script = join(root, 'hanging-worker.mjs');
		const pidFile = join(root, 'child.pid');
		writeFileSync(
			script,
			`import { spawn } from 'node:child_process';
			import { writeFileSync } from 'node:fs';
			process.once('message', () => {
				const child = spawn('sleep', ['60'], { stdio: 'ignore' });
				writeFileSync(${JSON.stringify(pidFile)}, String(child.pid));
			});`
		);
		const running = (pid: number) => {
			try {
				process.kill(pid, 0);
				return true;
			} catch {
				return false;
			}
		};

		const exitListeners = process.listenerCount('exit');

		// Long enough for the stand-in to start its child even on a busy machine, which the deadline
		// counts from the fork.
		const syncing = syncSource(db, source, {
			key,
			policy: LOCAL,
			workDirectory: work,
			indexingDeadlineMs: 5000,
			indexingScript: script
		});
		await vi.waitFor(() => expect(existsSync(pidFile)).toBe(true), { timeout: 5000 });
		const pid = Number(readFileSync(pidFile, 'utf8'));
		try {
			expect(await syncing).toMatchObject({ status: 'failed', kind: 'deadline' });
			// The stop for a server exit goes once the indexing process has ended.
			await vi.waitFor(() => expect(process.listenerCount('exit')).toBe(exitListeners));
			await vi.waitFor(() => expect(running(pid)).toBe(false), { timeout: 5000 });
			expect(readdirSync(work)).toEqual([]);
		} finally {
			if (running(pid)) process.kill(pid, 'SIGKILL');
		}
	});

	it('keeps the text of an indexing process that ends before it parses a page', async () => {
		const script = join(root, 'dying-worker.mjs');
		writeFileSync(script, `process.once('message', () => process.kill(process.pid, 'SIGKILL'));`);

		const result = await syncSource(db, source, {
			key,
			policy: LOCAL,
			workDirectory: work,
			indexingScript: script
		});

		expect(result).toMatchObject({
			status: 'failed',
			error: 'indexing ended with SIGKILL before it finished, out of memory for example',
			kind: 'aborted'
		});
	});

	it('names the page an indexing process was parsing when it outlasts the deadline', async () => {
		// A stand-in that notes a page the way the indexing process does and then never answers.
		const script = join(root, 'stuck-worker.mjs');
		writeFileSync(
			script,
			`import { appendFileSync } from 'node:fs';
			process.once('message', (job) => {
				appendFileSync(job.pageLog, 'docs/index.md\\n');
				appendFileSync(job.pageLog, 'docs/guide.md\\n');
				setInterval(() => {}, 1000);
			});`
		);

		const result = await syncSource(db, source, {
			key,
			policy: LOCAL,
			workDirectory: work,
			indexingDeadlineMs: 3000,
			indexingScript: script
		});

		expect(result).toMatchObject({
			status: 'failed',
			error: 'indexing took longer than 3 seconds, while indexing docs/guide.md',
			kind: 'deadline'
		});
		await vi.waitFor(() => expect(readdirSync(work)).toEqual([]));
	});

	// A process near its heap limit collects garbage over and over before it dies, about 2 s; a core
	// dump would take seconds more, which `make test` turns off with `prlimit --core=1`.
	it('fails a sync whose indexing runs out of memory and keeps syncing other sources', async () => {
		// Below MAX_PAGE_BYTES, so it is parsed, yet far beyond what 32 MB of heap hold.
		const sections = Array.from({ length: 2_000 }, (_, i) => `## Section ${i}\n\n${filler}`);
		commitFiles({ 'docs/huge.md': `# Huge\n\n${sections.join('\n\n')}` });

		const exhausted = await syncSource(db, source, {
			key,
			policy: LOCAL,
			workDirectory: work,
			indexingHeapMb: 32
		});

		expect(exhausted).toEqual({
			status: 'failed',
			error: expect.stringMatching(
				/^indexing ended with .+ before it finished, while indexing docs\/huge\.md, out of memory/
			),
			kind: 'aborted',
			commit: git(bare, 'rev-parse', 'main').trim()
		});
		expect(readdirSync(work)).toEqual([]);
		const other = addSource(`file://${bare}`, ['docs/huge.md', 'docs/drafts/**']);
		expect(
			await syncSource(db, other, { key, policy: LOCAL, workDirectory: work, indexingHeapMb: 32 })
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

		const outcome = await syncSource(db, source, {
			key,
			policy: LOCAL,
			workDirectory: work,
			lanes
		});

		expect(outcome.status).toBe('failed');
		expect({
			pages: rows('SELECT id FROM pages').length,
			snippets: rows('SELECT id FROM snippets').length,
			links: rows('SELECT target FROM links').length,
			runs: rows('SELECT id FROM sync_runs').length
		}).toEqual({ pages: 0, snippets: 0, links: 0, runs: 0 });
	});

	it('writes nothing into a source created while the sync of a deleted one waited', async () => {
		// Before ids were never reused, the new source took the deleted one's id and its content.
		let created = 0;
		const lanes: SyncLanes = {
			check: (run) => run(),
			sync: (run) => {
				db.prepare('DELETE FROM sources').run();
				created = addSource('https://git.example/other.git', []);
				return run();
			}
		};

		await syncSource(db, source, { key, policy: LOCAL, workDirectory: work, lanes });

		expect(created).not.toBe(source);
		expect({
			pages: rows('SELECT id FROM pages').length,
			runs: rows('SELECT id FROM sync_runs').length,
			state: rows(
				'SELECT index_generation, last_commit, error, warnings FROM sources WHERE id = ?',
				created
			)
		}).toEqual({
			pages: 0,
			runs: 0,
			state: [{ index_generation: 0, last_commit: null, error: null, warnings: '[]' }]
		});
	});
});

describe('changing a source while its sync waits', () => {
	it('does not publish what the old settings reached', async () => {
		const lanes: SyncLanes = {
			check: (run) => run(),
			sync: (run) => {
				db.prepare('UPDATE sources SET exclusions = \'["docs/deploy.md"]\'').run();
				return run();
			}
		};

		const outcome = await syncSource(db, source, {
			key,
			policy: LOCAL,
			workDirectory: work,
			lanes
		});

		expect(outcome).toMatchObject({ status: 'failed', error: /changed or deleted/ });
		expect({
			pages: rows('SELECT id FROM pages').length,
			state: rows('SELECT index_generation, last_commit FROM sources')
		}).toEqual({ pages: 0, state: [{ index_generation: 0, last_commit: null }] });
	});
});
