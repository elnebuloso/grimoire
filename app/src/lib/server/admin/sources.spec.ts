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
	savingChanges,
	sourceProblem,
	storedSource,
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
		public: false,
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

/** Checks and saves `form` as the source page does, without asking the Git server. */
function trySave(sourceId: number | undefined, form: SourceForm) {
	const stored = storedSource(db, sourceId);
	const problem = sourceProblem(db, sourceId, stored, form);
	if (problem) return { error: problem };
	return saveSource(db, KEY, sourceId, form, savingChanges(stored, form));
}

function created(result: { id: number } | { error: string } | 'not-found'): number {
	if (result === 'not-found' || 'error' in result) throw new Error(JSON.stringify(result));
	return result.id;
}

beforeEach(() => {
	db = openDatabase(':memory:');
});

describe('saveSource', () => {
	it('stores exclusions one per line and empty optional fields as null', () => {
		const id = created(trySave(undefined, sourceForm({ exclusions: ' a/** \n\n b.md\n' })));

		expect(findSource(db, id)).toEqual({
			id,
			slug: 'auth-service',
			name: 'Auth Service',
			description: '',
			gitUrl: 'https://gitlab.example.com/platform/auth.git',
			docsUrl: null,
			branch: 'main',
			path: 'docs',
			exclusions: ['a/**', 'b.md'],
			schedule: null,
			paused: false,
			public: false,
			username: null,
			hasToken: false
		});
	});

	it('stores the path without a trailing slash', () => {
		const id = created(trySave(undefined, sourceForm({ path: 'docs/' })));

		expect(findSource(db, id)).toMatchObject({ path: 'docs' });
	});

	it('keeps the index of a stored path with a trailing slash saved without it', () => {
		const id = created(trySave(undefined, sourceForm()));
		db.prepare(`UPDATE sources SET path = 'docs/', last_commit = 'c1' WHERE id = ?`).run(id);

		expect(savingChanges(storedSource(db, id), sourceForm({ path: 'docs' }))).toEqual({
			access: false,
			index: false,
			reindex: false
		});
		created(trySave(id, sourceForm({ path: 'docs' })));
		expect(db.prepare('SELECT last_commit FROM sources WHERE id = ?').get(id)).toEqual({
			last_commit: 'c1'
		});
	});

	it('drops the indexed commit when the path changes', () => {
		const id = created(trySave(undefined, sourceForm()));
		db.prepare(`UPDATE sources SET last_commit = 'c1' WHERE id = ?`).run(id);

		created(trySave(id, sourceForm({ path: 'guides' })));
		expect(db.prepare('SELECT last_commit FROM sources WHERE id = ?').get(id)).toEqual({
			last_commit: null
		});
	});

	it('creates a source private and switches it public and back', () => {
		const id = created(trySave(undefined, sourceForm()));
		expect(findSource(db, id)).toMatchObject({ public: false });

		trySave(id, sourceForm({ public: true }));
		expect(findSource(db, id)).toMatchObject({ public: true });

		trySave(id, sourceForm({ public: false }));
		expect(findSource(db, id)).toMatchObject({ public: false });
	});

	it('leaves a paused source out of polling and brings it back with its last check', () => {
		const id = created(trySave(undefined, sourceForm({ schedule: '0 2 * * *' })));
		const checkedAt = new Date('2026-10-28T02:00:30Z');
		recordCheck(db, id, checkedAt);

		trySave(id, sourceForm({ schedule: '0 2 * * *', paused: true }));
		expect(findSource(db, id)).toMatchObject({ paused: true, schedule: '0 2 * * *' });
		expect(listSchedules(db)).toEqual([]);

		trySave(id, sourceForm({ schedule: '0 2 * * *', paused: false }));
		expect(listSchedules(db)).toEqual([{ id, schedule: '0 2 * * *', lastCheckedAt: checkedAt }]);
	});

	it('leaves every source out of polling while all syncs are paused, without changing them', () => {
		const scheduled = created(trySave(undefined, sourceForm({ schedule: '0 2 * * *' })));
		const paused = created(trySave(undefined, sourceForm({ name: 'Billing', paused: true })));
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
		const id = created(trySave(undefined, sourceForm()));

		trySave(id, sourceForm({ name: 'Login' }));

		expect(findSource(db, id)).toMatchObject({ slug: 'auth-service', name: 'Login' });
	});

	it('changes the slug only with the current slug typed and while no other source has it', () => {
		const id = created(trySave(undefined, sourceForm()));
		created(trySave(undefined, sourceForm({ name: 'Billing' })));
		const change = (slug: string, confirmation: string) =>
			changeSourceSlug(db, id, { slug, confirmation });

		expect(change('login', 'auth')).toEqual({
			error: expect.stringContaining('Type the current slug auth-service')
		});
		expect(change('billing', 'auth-service')).toEqual({ error: 'The slug "billing" is taken.' });
		expect(change('login', 'auth-service')).toEqual({ id });
		expect(findSource(db, id)?.slug).toBe('login');
	});

	it('derives the slug from the name, umlauts spelled out', () => {
		const id = created(trySave(undefined, sourceForm({ name: ' Prüfung & Abnahme ' })));

		expect(findSource(db, id)).toMatchObject({
			slug: 'pruefung-abnahme',
			name: 'Prüfung & Abnahme'
		});
	});

	it.each([
		['', 'Enter a name.'],
		['   ', 'Enter a name.'],
		['!!!', 'The name needs a letter or digit'],
		['a'.repeat(81), 'at most 80 characters']
	])('rejects the name "%s"', (name, message) => {
		expect(trySave(undefined, sourceForm({ name }))).toEqual({
			error: expect.stringContaining(message)
		});
	});

	it.each([
		['Auth Service', 'The slug may contain'],
		['a'.repeat(41), 'at most 40 characters'],
		['auth-service', 'That is the current slug.']
	])('refuses to change the slug to "%s"', (slug, message) => {
		const id = created(trySave(undefined, sourceForm()));

		expect(changeSourceSlug(db, id, { slug, confirmation: 'auth-service' })).toEqual({
			error: expect.stringContaining(message)
		});
		expect(findSource(db, id)?.slug).toBe('auth-service');
	});

	it('tells a missing source apart from a refused save', () => {
		expect(trySave(1, sourceForm())).toBe('not-found');
	});

	it('tells a missing source apart from a refused slug change', () => {
		expect(changeSourceSlug(db, 1, { slug: 'login', confirmation: 'auth-service' })).toBe(
			'not-found'
		);
	});

	it('rejects a slug another source already has', () => {
		created(trySave(undefined, sourceForm()));

		expect(trySave(undefined, sourceForm({ name: 'AUTH service!' }))).toEqual({
			error: 'A source with the slug "auth-service" already exists.'
		});
	});

	it('changes every setting of a stored source', () => {
		const id = created(trySave(undefined, sourceForm()));
		const edited = {
			name: 'Login Service',
			description: 'Login and sessions',
			gitUrl: 'https://gitlab.example.com/platform/login.git',
			docsUrl: 'https://docs.example.com/login/',
			branch: 'release',
			path: 'site',
			exclusions: 'drafts/**',
			schedule: '0 2 * * *',
			paused: true,
			public: true,
			username: 'ci'
		};

		created(trySave(id, sourceForm(edited)));

		expect(findSource(db, id)).toEqual({
			...edited,
			id,
			slug: 'auth-service',
			exclusions: ['drafts/**'],
			hasToken: false
		});
	});

	it('stores the description trimmed and changes it', () => {
		const id = created(trySave(undefined, sourceForm({ description: ' Login ' })));
		expect(findSource(db, id)?.description).toBe('Login');

		trySave(id, sourceForm({ description: 'Login and sessions' }));
		expect(findSource(db, id)?.description).toBe('Login and sessions');
	});

	it.each([
		['not a URL', 'Enter the Git URL'],
		['http://gitlab.example.com/a.git', 'must start with https://'],
		['git@gitlab.example.com:a.git', 'Enter the Git URL'],
		['https://user:secret@gitlab.example.com/a.git', 'in their own fields'],
		['https://user@gitlab.example.com/a.git', 'in their own fields']
	])('rejects the Git URL %s', (gitUrl, message) => {
		expect(trySave(undefined, sourceForm({ gitUrl }))).toEqual({
			error: expect.stringContaining(message)
		});
	});

	it('stores, changes and clears the documentation URL', () => {
		const docsUrl = 'https://docs.example.com/platform/';
		const id = created(trySave(undefined, sourceForm({ docsUrl })));
		expect(findSource(db, id)?.docsUrl).toBe(docsUrl);

		trySave(id, sourceForm({ docsUrl: ' http://intranet/docs/ ' }));
		expect(findSource(db, id)?.docsUrl).toBe('http://intranet/docs/');

		trySave(id, sourceForm({ docsUrl: ' ' }));
		expect(findSource(db, id)?.docsUrl).toBeNull();
	});

	it.each([
		['docs.example.com/platform', 'web address'],
		['ftp://docs.example.com/', 'web address'],
		['javascript:alert(1)', 'web address'],
		['https://user:secret@docs.example.com/', 'username or password']
	])('rejects the documentation URL %s', (docsUrl, message) => {
		expect(trySave(undefined, sourceForm({ docsUrl }))).toEqual({
			error: expect.stringContaining(message)
		});
	});

	it.each(['/etc', '../other', 'docs/../../etc'])('rejects the path %s', (path) => {
		expect(trySave(undefined, sourceForm({ path }))).toEqual({
			error: expect.stringContaining('may not contain')
		});
	});

	it('rejects an empty branch and a schedule that is not five cron fields', () => {
		expect(trySave(undefined, sourceForm({ branch: ' ' }))).toEqual({
			error: 'Enter the branch.'
		});
		expect(trySave(undefined, sourceForm({ schedule: '* * * * * *' }))).toEqual({
			error: expect.stringContaining('Schedule: invalid cron expression')
		});
	});

	it('encrypts the token, keeps it when none is entered and removes it on request', () => {
		const id = created(trySave(undefined, sourceForm({ token: 'secret' })));
		expect(storedToken(id)).toBe('secret');

		trySave(id, sourceForm({ branch: 'release' }));
		expect(storedToken(id)).toBe('secret');
		expect(findSource(db, id)).toMatchObject({ branch: 'release', hasToken: true });

		trySave(id, sourceForm({ token: 'rotated' }));
		expect(storedToken(id)).toBe('rotated');

		trySave(id, sourceForm({ removeToken: true }));
		expect(storedToken(id)).toBeNull();
	});

	it('does not carry a stored token to another server without it being entered again', () => {
		const id = created(trySave(undefined, sourceForm({ token: 'secret' })));
		const elsewhere = 'https://evil.example.com/platform/auth.git';

		expect(trySave(id, sourceForm({ gitUrl: elsewhere }))).toEqual({
			error: 'The Git URL points to another server: enter the token again or remove it.'
		});
		expect(trySave(id, sourceForm({ gitUrl: elsewhere, token: 'other' }))).toEqual({
			id
		});
	});

	it('keeps the token when the URL changes on the same server', () => {
		const id = created(trySave(undefined, sourceForm({ token: 'secret' })));
		const moved = 'https://gitlab.example.com/platform/auth-docs.git';

		expect(trySave(id, sourceForm({ gitUrl: moved }))).toEqual({ id });
		expect(storedToken(id)).toBe('secret');
	});
});

describe('savingChanges', () => {
	it('changes everything for a new source', () => {
		expect(savingChanges(undefined, sourceForm())).toEqual({
			access: true,
			index: true,
			reindex: true
		});
	});

	it('ignores name, schedule, pause, visibility and description', () => {
		const id = created(trySave(undefined, sourceForm({ token: 'secret' })));

		expect(
			savingChanges(
				storedSource(db, id),
				sourceForm({
					name: 'Other',
					description: 'Login',
					schedule: '0 2 * * *',
					paused: true,
					public: true
				})
			)
		).toEqual({ access: false, index: false, reindex: false });
	});

	it.each([
		[{ gitUrl: 'https://gitlab.example.com/platform/login.git' }, true, true],
		[{ branch: 'develop' }, true, true],
		[{ username: 'ci' }, true, false],
		[{ token: 'rotated' }, true, false],
		[{ removeToken: true }, true, false],
		[{ path: 'guides' }, false, true],
		[{ exclusions: 'drafts/**' }, false, true]
	])('for %j changes access %s and the index %s', (changes, access, index) => {
		const id = created(trySave(undefined, sourceForm({ token: 'secret' })));

		expect(savingChanges(storedSource(db, id), sourceForm(changes))).toEqual({
			access,
			index,
			reindex: index
		});
	});

	it('syncs a source whose last sync failed again without changing its index', () => {
		const id = created(trySave(undefined, sourceForm()));
		db.prepare(`UPDATE sources SET error = 'unreachable' WHERE id = ?`).run(id);

		expect(savingChanges(storedSource(db, id), sourceForm())).toEqual({
			access: false,
			index: false,
			reindex: true
		});
	});
});

describe('findSource', () => {
	it('shows a stored URL without credentials and finds no unknown source', () => {
		const id = created(trySave(undefined, sourceForm()));
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
		created(trySave(undefined, sourceForm({ name: 'Platform docs' })));
		created(trySave(undefined, sourceForm({ name: 'Billing docs' })));

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
