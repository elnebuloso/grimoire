import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import { listSchedules, recordCheck } from '../db/sources';
import { saveSettings } from '../settings';
import { decryptToken } from '../token-encryption';
import {
	changeSourceSlug,
	findSource,
	listSources,
	parseIdParam,
	saveSource,
	type SourceForm
} from './sources';

const KEY = Buffer.alloc(32, 7);

let db: DatabaseSync;

function sourceForm(changes: Partial<SourceForm> = {}): SourceForm {
	return {
		name: 'Auth Service',
		description: '',
		gitUrl: 'https://gitlab.example.com/platform/auth.git',
		docsUrl: '',
		branch: 'main',
		path: 'docs/',
		exclusions: '',
		schedule: '',
		paused: false,
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
});

describe('saveSource', () => {
	it('stores exclusions one per line and empty optional fields as null', () => {
		const id = created(
			saveSource(db, KEY, undefined, sourceForm({ exclusions: ' a/** \n\n b.md\n' }))
		);

		expect(findSource(db, id)).toEqual({
			id,
			slug: 'auth-service',
			name: 'Auth Service',
			description: '',
			gitUrl: 'https://gitlab.example.com/platform/auth.git',
			docsUrl: null,
			branch: 'main',
			path: 'docs/',
			exclusions: ['a/**', 'b.md'],
			schedule: null,
			paused: false,
			username: null,
			hasToken: false
		});
	});

	it('leaves a paused source out of polling and brings it back with its last check', () => {
		const id = created(saveSource(db, KEY, undefined, sourceForm({ schedule: '0 2 * * *' })));
		const checkedAt = new Date('2026-10-28T02:00:30Z');
		recordCheck(db, id, checkedAt);

		saveSource(db, KEY, id, sourceForm({ schedule: '0 2 * * *', paused: true }));
		expect(findSource(db, id)).toMatchObject({ paused: true, schedule: '0 2 * * *' });
		expect(listSchedules(db)).toEqual([]);

		saveSource(db, KEY, id, sourceForm({ schedule: '0 2 * * *', paused: false }));
		expect(listSchedules(db)).toEqual([{ id, schedule: '0 2 * * *', lastCheckedAt: checkedAt }]);
	});

	it('leaves every source out of polling while all syncs are paused, without changing them', () => {
		const scheduled = created(
			saveSource(db, KEY, undefined, sourceForm({ schedule: '0 2 * * *' }))
		);
		const paused = created(
			saveSource(db, KEY, undefined, sourceForm({ name: 'Billing', paused: true }))
		);
		const before = [findSource(db, scheduled), findSource(db, paused)];

		saveSettings(db, { syncsPaused: true });
		expect(listSchedules(db)).toEqual([]);

		saveSettings(db, { syncsPaused: false });
		expect(listSchedules(db)).toEqual([
			{ id: scheduled, schedule: '0 2 * * *', lastCheckedAt: null }
		]);
		expect([findSource(db, scheduled), findSource(db, paused)]).toEqual(before);
	});

	it('keeps the slug when the name changes', () => {
		const id = created(saveSource(db, KEY, undefined, sourceForm()));

		saveSource(db, KEY, id, sourceForm({ name: 'Login' }));

		expect(findSource(db, id)).toMatchObject({ slug: 'auth-service', name: 'Login' });
	});

	it('changes the slug only with the current slug typed and while no other source has it', () => {
		const id = created(saveSource(db, KEY, undefined, sourceForm()));
		created(saveSource(db, KEY, undefined, sourceForm({ name: 'Billing' })));
		const change = (slug: string, confirmation: string) =>
			changeSourceSlug(db, id, { slug, confirmation });

		expect(change('login', 'auth')).toEqual({
			error: expect.stringContaining('Type the current slug auth-service')
		});
		expect(change('billing', 'auth-service')).toEqual({ error: 'The slug "billing" is taken.' });
		expect(change('login', 'auth-service')).toEqual({ id });
		expect(findSource(db, id)?.slug).toBe('login');
	});

	it('rejects a slug another source already has', () => {
		created(saveSource(db, KEY, undefined, sourceForm()));

		expect(saveSource(db, KEY, undefined, sourceForm({ name: 'AUTH service!' }))).toEqual({
			error: 'A source with the slug "auth-service" already exists.'
		});
	});

	it('stores the description trimmed and changes it', () => {
		const id = created(saveSource(db, KEY, undefined, sourceForm({ description: ' Login ' })));
		expect(findSource(db, id)?.description).toBe('Login');

		saveSource(db, KEY, id, sourceForm({ description: 'Login and sessions' }));
		expect(findSource(db, id)?.description).toBe('Login and sessions');
	});

	it.each([
		['not a URL', 'Enter the Git URL'],
		['http://gitlab.example.com/a.git', 'must start with https://'],
		['git@gitlab.example.com:a.git', 'Enter the Git URL'],
		['https://user:secret@gitlab.example.com/a.git', 'in their own fields'],
		['https://user@gitlab.example.com/a.git', 'in their own fields']
	])('rejects the Git URL %s', (gitUrl, message) => {
		expect(saveSource(db, KEY, undefined, sourceForm({ gitUrl }))).toEqual({
			error: expect.stringContaining(message)
		});
	});

	it('stores, changes and clears the documentation URL', () => {
		const docsUrl = 'https://docs.example.com/platform/';
		const id = created(saveSource(db, KEY, undefined, sourceForm({ docsUrl })));
		expect(findSource(db, id)?.docsUrl).toBe(docsUrl);

		saveSource(db, KEY, id, sourceForm({ docsUrl: ' http://intranet/docs/ ' }));
		expect(findSource(db, id)?.docsUrl).toBe('http://intranet/docs/');

		saveSource(db, KEY, id, sourceForm({ docsUrl: ' ' }));
		expect(findSource(db, id)?.docsUrl).toBeNull();
	});

	it.each([
		['docs.example.com/platform', 'web address'],
		['ftp://docs.example.com/', 'web address'],
		['javascript:alert(1)', 'web address'],
		['https://user:secret@docs.example.com/', 'username or password']
	])('rejects the documentation URL %s', (docsUrl, message) => {
		expect(saveSource(db, KEY, undefined, sourceForm({ docsUrl }))).toEqual({
			error: expect.stringContaining(message)
		});
	});

	it.each(['/etc', '../other', 'docs/../../etc'])('rejects the path %s', (path) => {
		expect(saveSource(db, KEY, undefined, sourceForm({ path }))).toEqual({
			error: expect.stringContaining('may not contain')
		});
	});

	it('rejects an empty branch and a schedule that is not five cron fields', () => {
		expect(saveSource(db, KEY, undefined, sourceForm({ branch: ' ' }))).toEqual({
			error: 'Enter the branch.'
		});
		expect(saveSource(db, KEY, undefined, sourceForm({ schedule: '* * * * * *' }))).toEqual({
			error: expect.stringContaining('Schedule: invalid cron expression')
		});
	});

	it('encrypts the token, keeps it when none is entered and removes it on request', () => {
		const id = created(saveSource(db, KEY, undefined, sourceForm({ token: 'secret' })));
		expect(storedToken(id)).toBe('secret');

		saveSource(db, KEY, id, sourceForm({ branch: 'release' }));
		expect(storedToken(id)).toBe('secret');
		expect(findSource(db, id)).toMatchObject({ branch: 'release', hasToken: true });

		saveSource(db, KEY, id, sourceForm({ token: 'rotated' }));
		expect(storedToken(id)).toBe('rotated');

		saveSource(db, KEY, id, sourceForm({ removeToken: true }));
		expect(storedToken(id)).toBeNull();
	});

	it('does not carry a stored token to another server without it being entered again', () => {
		const id = created(saveSource(db, KEY, undefined, sourceForm({ token: 'secret' })));
		const elsewhere = 'https://evil.example.com/platform/auth.git';

		expect(saveSource(db, KEY, id, sourceForm({ gitUrl: elsewhere }))).toEqual({
			error: 'The Git URL points to another server: enter the token again or remove it.'
		});
		expect(saveSource(db, KEY, id, sourceForm({ gitUrl: elsewhere, token: 'other' }))).toEqual({
			id
		});
	});

	it('keeps the token when the URL changes on the same server', () => {
		const id = created(saveSource(db, KEY, undefined, sourceForm({ token: 'secret' })));
		const moved = 'https://gitlab.example.com/platform/auth-docs.git';

		expect(saveSource(db, KEY, id, sourceForm({ gitUrl: moved }))).toEqual({ id });
		expect(storedToken(id)).toBe('secret');
	});
});

describe('findSource', () => {
	it('shows a stored URL without credentials and finds no unknown source', () => {
		const id = created(saveSource(db, KEY, undefined, sourceForm()));
		db.prepare('UPDATE sources SET git_url = ? WHERE id = ?').run(
			'https://user:secret@gitlab.example.com/a.git',
			id
		);

		expect(findSource(db, id)?.gitUrl).toBe('https://gitlab.example.com/a.git');
		expect(findSource(db, id + 1)).toBeUndefined();
	});
});

describe('listSources', () => {
	it('lists every source by slug', () => {
		created(saveSource(db, KEY, undefined, sourceForm({ name: 'Platform docs' })));
		created(saveSource(db, KEY, undefined, sourceForm({ name: 'Billing docs' })));

		expect(listSources(db).map((source) => source.slug)).toEqual(['billing-docs', 'platform-docs']);
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
