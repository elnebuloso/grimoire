import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import { decryptToken } from '../token-encryption';
import { findSource, parseIdParam, saveProject, saveSource, type SourceForm } from './projects';

const KEY = Buffer.alloc(32, 7);

let db: DatabaseSync;
let projectId: number;

function sourceForm(changes: Partial<SourceForm> = {}): SourceForm {
	return {
		slug: 'auth-service',
		gitUrl: 'https://gitlab.example.com/platform/auth.git',
		branch: 'main',
		path: 'docs/',
		exclusions: '',
		schedule: '',
		username: '',
		token: '',
		removeToken: false,
		...changes
	};
}

function storedToken(sourceId: number): string | null {
	const row = db.prepare('SELECT encrypted_token FROM sources WHERE id = ?').get(sourceId) as {
		encrypted_token: string | null;
	};
	return row.encrypted_token && decryptToken(row.encrypted_token, KEY);
}

function created(result: { id: number } | { error: string }): number {
	if ('error' in result) throw new Error(result.error);
	return result.id;
}

beforeEach(() => {
	db = openDatabase(':memory:');
	projectId = created(saveProject(db, undefined, { slug: 'platform', description: '' }));
});

describe('saveProject', () => {
	it('stores trimmed values and updates them by id', () => {
		const id = created(saveProject(db, undefined, { slug: ' billing ', description: ' Bills ' }));
		saveProject(db, id, { slug: 'payments', description: 'Payments' });

		expect(db.prepare('SELECT slug, description FROM projects WHERE id = ?').get(id)).toEqual({
			slug: 'payments',
			description: 'Payments'
		});
	});

	it.each(['', 'Platform', 'a_b', 'a--b', '-a', 'a/b', 'a.b'])('rejects the slug "%s"', (slug) => {
		expect(saveProject(db, undefined, { slug, description: '' })).toEqual({
			error: expect.stringContaining('The slug may contain')
		});
	});

	it('rejects a slug another project has, but keeps its own', () => {
		expect(saveProject(db, undefined, { slug: 'platform', description: '' })).toEqual({
			error: 'A project with the slug "platform" already exists.'
		});
		expect(saveProject(db, projectId, { slug: 'platform', description: 'x' })).toEqual({
			id: projectId
		});
	});
});

describe('saveSource', () => {
	it('stores exclusions one per line and empty optional fields as null', () => {
		const id = created(
			saveSource(db, KEY, projectId, undefined, sourceForm({ exclusions: ' a/** \n\n b.md\n' }))
		);

		expect(findSource(db, projectId, id)).toEqual({
			id,
			slug: 'auth-service',
			gitUrl: 'https://gitlab.example.com/platform/auth.git',
			branch: 'main',
			path: 'docs/',
			exclusions: ['a/**', 'b.md'],
			schedule: null,
			username: null,
			hasToken: false
		});
	});

	it('rejects a slug the project already has, but not one of another project', () => {
		created(saveSource(db, KEY, projectId, undefined, sourceForm()));
		const other = created(saveProject(db, undefined, { slug: 'other', description: '' }));

		expect(saveSource(db, KEY, projectId, undefined, sourceForm())).toEqual({
			error: 'This project already has a source with the slug "auth-service".'
		});
		expect(saveSource(db, KEY, other, undefined, sourceForm())).toHaveProperty('id');
	});

	it.each([
		['not a URL', 'Enter the Git URL'],
		['http://gitlab.example.com/a.git', 'must start with https://'],
		['git@gitlab.example.com:a.git', 'Enter the Git URL'],
		['https://user:secret@gitlab.example.com/a.git', 'in their own fields'],
		['https://user@gitlab.example.com/a.git', 'in their own fields']
	])('rejects the Git URL %s', (gitUrl, message) => {
		expect(saveSource(db, KEY, projectId, undefined, sourceForm({ gitUrl }))).toEqual({
			error: expect.stringContaining(message)
		});
	});

	it.each(['/etc', '../other', 'docs/../../etc'])('rejects the path %s', (path) => {
		expect(saveSource(db, KEY, projectId, undefined, sourceForm({ path }))).toEqual({
			error: expect.stringContaining('may not contain')
		});
	});

	it('rejects an empty branch and a schedule that is not five cron fields', () => {
		expect(saveSource(db, KEY, projectId, undefined, sourceForm({ branch: ' ' }))).toEqual({
			error: 'Enter the branch.'
		});
		expect(
			saveSource(db, KEY, projectId, undefined, sourceForm({ schedule: '* * * * * *' }))
		).toEqual({ error: expect.stringContaining('Schedule: invalid cron expression') });
	});

	it('encrypts the token, keeps it when none is entered and removes it on request', () => {
		const id = created(saveSource(db, KEY, projectId, undefined, sourceForm({ token: 'secret' })));
		expect(storedToken(id)).toBe('secret');

		saveSource(db, KEY, projectId, id, sourceForm({ branch: 'release' }));
		expect(storedToken(id)).toBe('secret');
		expect(findSource(db, projectId, id)).toMatchObject({ branch: 'release', hasToken: true });

		saveSource(db, KEY, projectId, id, sourceForm({ token: 'rotated' }));
		expect(storedToken(id)).toBe('rotated');

		saveSource(db, KEY, projectId, id, sourceForm({ removeToken: true }));
		expect(storedToken(id)).toBeNull();
	});

	it('does not carry a stored token to another server without it being entered again', () => {
		const id = created(saveSource(db, KEY, projectId, undefined, sourceForm({ token: 'secret' })));
		const elsewhere = 'https://evil.example.com/platform/auth.git';

		expect(saveSource(db, KEY, projectId, id, sourceForm({ gitUrl: elsewhere }))).toEqual({
			error: 'The Git URL points to another server: enter the token again or remove it.'
		});
		expect(
			saveSource(db, KEY, projectId, id, sourceForm({ gitUrl: elsewhere, token: 'other' }))
		).toEqual({ id });
	});

	it('keeps the token when the URL changes on the same server', () => {
		const id = created(saveSource(db, KEY, projectId, undefined, sourceForm({ token: 'secret' })));
		const moved = 'https://gitlab.example.com/platform/auth-docs.git';

		expect(saveSource(db, KEY, projectId, id, sourceForm({ gitUrl: moved }))).toEqual({ id });
		expect(storedToken(id)).toBe('secret');
	});
});

describe('findSource', () => {
	it('shows a stored URL without credentials and only finds sources of the given project', () => {
		const id = created(saveSource(db, KEY, projectId, undefined, sourceForm()));
		db.prepare('UPDATE sources SET git_url = ? WHERE id = ?').run(
			'https://user:secret@gitlab.example.com/a.git',
			id
		);
		const other = created(saveProject(db, undefined, { slug: 'other', description: '' }));

		expect(findSource(db, projectId, id)?.gitUrl).toBe('https://gitlab.example.com/a.git');
		expect(findSource(db, other, id)).toBeUndefined();
	});
});

describe('parseIdParam', () => {
	it('reads a positive integer or "new" and nothing else', () => {
		expect(['12', 'new', '0', '01', '1.5', 'abc', ''].map(parseIdParam)).toEqual([
			12,
			'new',
			undefined,
			undefined,
			undefined,
			undefined,
			undefined
		]);
	});
});
