import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import * as git from '../sync/git';
import { saveProject, saveSource, type SourceForm } from './projects';
import { accessChanged, checkSourceAccess } from './source-access';

vi.mock('../sync/git', async (original) => {
	const actual = await original<typeof git>();
	return { ...actual, checkRemote: vi.fn(actual.checkRemote) };
});

const KEY = Buffer.alloc(32, 7);
let directory: string;
let url: string;
let db: DatabaseSync;

function form(changes: Partial<SourceForm> = {}): SourceForm {
	return {
		name: 'Docs',
		gitUrl: url,
		branch: 'main',
		path: 'docs/',
		exclusions: '',
		schedule: '',
		paused: false,
		username: 'deploy',
		token: '',
		removeToken: false,
		...changes
	};
}

beforeAll(() => {
	directory = mkdtempSync(join(tmpdir(), 'grimoire-access-'));
	const work = join(directory, 'work');
	const run = (...args: string[]) => execFileSync('git', args, { cwd: work });
	execFileSync('git', ['init', '--quiet', '--initial-branch=main', work]);
	writeFileSync(join(work, 'index.md'), '# Docs\n');
	run('add', '.');
	run('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '--quiet', '-m', 'x');
	execFileSync('git', ['clone', '--quiet', '--bare', work, join(directory, 'docs.git')]);
	url = `file://${join(directory, 'docs.git')}`;
});

afterAll(() => rmSync(directory, { recursive: true, force: true }));

beforeEach(() => {
	db = openDatabase(':memory:');
	vi.mocked(git.checkRemote).mockClear();
});

/** A stored source as saving would leave it; `saveSource` itself never asks the Git server. */
function storedSource(token = 'glpat-stored'): number {
	const project = saveProject(db, undefined, { name: 'Platform', description: '' });
	if ('error' in project) throw new Error(project.error);
	// The form only accepts https; the local repository is reached over file://.
	const source = saveSource(db, KEY, project.id, undefined, {
		...form({ token }),
		gitUrl: 'https://git.example/docs.git'
	});
	if ('error' in source) throw new Error(source.error);
	db.prepare('UPDATE sources SET git_url = ? WHERE id = ?').run(url, source.id);
	return source.id;
}

describe('checkSourceAccess', () => {
	it('reports the branch and its commit when the repository can be read', async () => {
		expect(await checkSourceAccess(db, KEY, undefined, form())).toEqual({
			ok: true,
			message: expect.stringMatching(/^Reachable: branch main is at commit [0-9a-f]{12}\.$/)
		});
	});

	it.each([
		[{ branch: 'develop' }, 'The repository has no branch develop.'],
		[{ gitUrl: 'file:///nowhere/docs.git' }, 'Access refused, or there is no repository']
	])('says why it cannot read %j', async (changes, message) => {
		const result = await checkSourceAccess(db, KEY, undefined, form(changes));

		expect(result).toEqual({ ok: false, message: expect.stringContaining(message) });
	});

	it('uses the stored token unless a new one is entered or its removal is asked for', async () => {
		const id = storedSource();
		const tokenUsed = () => vi.mocked(git.checkRemote).mock.lastCall?.[0].token;

		await checkSourceAccess(db, KEY, id, form());
		expect(tokenUsed()).toBe('glpat-stored');
		await checkSourceAccess(db, KEY, id, form({ token: 'glpat-new' }));
		expect(tokenUsed()).toBe('glpat-new');
		await checkSourceAccess(db, KEY, id, form({ removeToken: true }));
		expect(tokenUsed()).toBeUndefined();
	});
});

describe('accessChanged', () => {
	it('is true for a new source', () => {
		expect(accessChanged(db, undefined, form())).toBe(true);
	});

	it('ignores everything but URL, branch, username and token', () => {
		const id = storedSource();

		expect(
			accessChanged(
				db,
				id,
				form({ name: 'Other', path: 'site/', schedule: '0 2 * * *', paused: true })
			)
		).toBe(false);
	});

	it.each([
		{ gitUrl: 'file:///elsewhere.git' },
		{ branch: 'develop' },
		{ username: 'ci' },
		{ token: 'glpat-new' },
		{ removeToken: true }
	])('is true when %j changes', (changes) => {
		const id = storedSource();

		expect(accessChanged(db, id, form(changes))).toBe(true);
	});
});
