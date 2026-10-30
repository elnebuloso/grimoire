import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import { listSchedules, recordCheck } from '../db/sources';
import { saveSettings } from '../settings';
import { decryptToken } from '../token-encryption';
import {
	changeProjectSlug,
	changeSourceSlug,
	findProject,
	findSource,
	parseIdParam,
	saveProject,
	saveSource,
	type SourceForm
} from './projects';

const KEY = Buffer.alloc(32, 7);

let db: DatabaseSync;
let projectId: number;

function sourceForm(changes: Partial<SourceForm> = {}): SourceForm {
	return {
		name: 'Auth Service',
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
	projectId = created(saveProject(db, undefined, { name: 'Platform', description: '' }));
});

describe('saveProject', () => {
	it('derives the slug from the name on creation and keeps it when the name changes', () => {
		const id = created(
			saveProject(db, undefined, { name: ' Prüfung & Abnahme ', description: ' QA ' })
		);
		saveProject(db, id, { name: 'Quality', description: 'Checks' });

		expect(findProject(db, id)).toEqual({
			id,
			slug: 'pruefung-abnahme',
			name: 'Quality',
			description: 'Checks'
		});
	});

	it.each([
		['', 'Enter a name.'],
		['   ', 'Enter a name.'],
		['!!!', 'The name needs a letter or digit'],
		['a'.repeat(81), 'at most 80 characters']
	])('rejects the name "%s"', (name, message) => {
		expect(saveProject(db, undefined, { name, description: '' })).toEqual({
			error: expect.stringContaining(message)
		});
	});

	it('rejects a name whose slug another project has, and names that slug', () => {
		expect(saveProject(db, undefined, { name: 'PLATFORM!', description: '' })).toEqual({
			error: 'A project with the slug "platform" already exists.'
		});
	});
});

describe('changeProjectSlug', () => {
	const change = (slug: string, confirmation = 'platform') =>
		changeProjectSlug(db, projectId, { slug, confirmation });

	it('changes the slug once the current slug is typed', () => {
		expect(change('platform-team')).toBeUndefined();
		expect(findProject(db, projectId)).toMatchObject({ slug: 'platform-team', name: 'Platform' });
	});

	it.each([
		['platform-team', 'platfrom', 'Type the current slug platform to confirm.'],
		['Platform Team', 'platform', 'The slug may contain'],
		['a'.repeat(41), 'platform', 'at most 40 characters'],
		['platform', 'platform', 'That is the current slug.'],
		['other', 'platform', 'The slug "other" is taken.']
	])('rejects "%s" confirmed with "%s"', (slug, confirmation, message) => {
		created(saveProject(db, undefined, { name: 'Other', description: '' }));

		expect(change(slug, confirmation)).toContain(message);
		expect(findProject(db, projectId)?.slug).toBe('platform');
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
			name: 'Auth Service',
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

	it('changes no source of another project', () => {
		const id = created(
			saveSource(db, KEY, projectId, undefined, sourceForm({ token: 'glpat-stored' }))
		);
		const otherProject = created(saveProject(db, undefined, { name: 'Billing', description: '' }));
		const before = findSource(db, projectId, id);

		expect(() =>
			saveSource(db, KEY, otherProject, id, sourceForm({ name: 'Taken', token: 'glpat-x' }))
		).toThrow('has no source');
		changeSourceSlug(db, otherProject, id, { slug: 'taken', confirmation: 'auth-service' });

		expect(findSource(db, projectId, id)).toEqual(before);
		expect(storedToken(id)).not.toBeNull();
	});

	it('leaves a paused source out of polling and brings it back with its last check', () => {
		const id = created(
			saveSource(db, KEY, projectId, undefined, sourceForm({ schedule: '0 2 * * *' }))
		);
		const checkedAt = new Date('2026-10-28T02:00:30Z');
		recordCheck(db, id, checkedAt);

		saveSource(db, KEY, projectId, id, sourceForm({ schedule: '0 2 * * *', paused: true }));
		expect(findSource(db, projectId, id)).toMatchObject({ paused: true, schedule: '0 2 * * *' });
		expect(listSchedules(db)).toEqual([]);

		saveSource(db, KEY, projectId, id, sourceForm({ schedule: '0 2 * * *', paused: false }));
		expect(listSchedules(db)).toEqual([{ id, schedule: '0 2 * * *', lastCheckedAt: checkedAt }]);
	});

	it('leaves every source out of polling while all syncs are paused, without changing them', () => {
		const scheduled = created(
			saveSource(db, KEY, projectId, undefined, sourceForm({ schedule: '0 2 * * *' }))
		);
		const paused = created(
			saveSource(db, KEY, projectId, undefined, sourceForm({ name: 'Billing', paused: true }))
		);
		const before = [findSource(db, projectId, scheduled), findSource(db, projectId, paused)];

		saveSettings(db, { syncsPaused: true });
		expect(listSchedules(db)).toEqual([]);

		saveSettings(db, { syncsPaused: false });
		expect(listSchedules(db)).toEqual([
			{ id: scheduled, schedule: '0 2 * * *', lastCheckedAt: null }
		]);
		expect([findSource(db, projectId, scheduled), findSource(db, projectId, paused)]).toEqual(
			before
		);
	});

	it('keeps the slug when the name changes', () => {
		const id = created(saveSource(db, KEY, projectId, undefined, sourceForm()));

		saveSource(db, KEY, projectId, id, sourceForm({ name: 'Login' }));

		expect(findSource(db, projectId, id)).toMatchObject({ slug: 'auth-service', name: 'Login' });
	});

	it('changes the slug only with the current slug typed and while no other source has it', () => {
		const id = created(saveSource(db, KEY, projectId, undefined, sourceForm()));
		created(saveSource(db, KEY, projectId, undefined, sourceForm({ name: 'Billing' })));
		const change = (slug: string, confirmation: string) =>
			changeSourceSlug(db, projectId, id, { slug, confirmation });

		expect(change('login', 'auth')).toContain('Type the current slug auth-service');
		expect(change('billing', 'auth-service')).toBe('The slug "billing" is taken.');
		expect(change('login', 'auth-service')).toBeUndefined();
		expect(findSource(db, projectId, id)?.slug).toBe('login');
	});

	it('rejects a slug the project already has, but not one of another project', () => {
		created(saveSource(db, KEY, projectId, undefined, sourceForm()));
		const other = created(saveProject(db, undefined, { name: 'Other', description: '' }));

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

	it('stores, changes and clears the documentation URL', () => {
		const docsUrl = 'https://docs.example.com/platform/';
		const id = created(saveSource(db, KEY, projectId, undefined, sourceForm({ docsUrl })));
		expect(findSource(db, projectId, id)?.docsUrl).toBe(docsUrl);

		saveSource(db, KEY, projectId, id, sourceForm({ docsUrl: ' http://intranet/docs/ ' }));
		expect(findSource(db, projectId, id)?.docsUrl).toBe('http://intranet/docs/');

		saveSource(db, KEY, projectId, id, sourceForm({ docsUrl: ' ' }));
		expect(findSource(db, projectId, id)?.docsUrl).toBeNull();
	});

	it.each([
		['docs.example.com/platform', 'web address'],
		['ftp://docs.example.com/', 'web address'],
		['javascript:alert(1)', 'web address'],
		['https://user:secret@docs.example.com/', 'username or password']
	])('rejects the documentation URL %s', (docsUrl, message) => {
		expect(saveSource(db, KEY, projectId, undefined, sourceForm({ docsUrl }))).toEqual({
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
		const other = created(saveProject(db, undefined, { name: 'Other', description: '' }));

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
