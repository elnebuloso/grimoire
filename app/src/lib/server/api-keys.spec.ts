import { describe, it, expect, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from './db/schema';
import { listProjects } from './agent/operations';
import {
	createApiKey,
	isExpired,
	listApiKeys,
	revokeApiKey,
	scopeForKey,
	updateApiKey
} from './api-keys';

let db: DatabaseSync;

const CLOCK = { now: new Date('2026-10-30T12:00:00.000Z'), today: '2026-10-30' };

function later(seconds: number, today = CLOCK.today) {
	return { now: new Date(CLOCK.now.getTime() + seconds * 1000), today };
}

function lastUsed(id: number) {
	return listApiKeys(db).find((key) => key.id === id)!.lastUsedAt;
}

beforeEach(() => {
	db = openDatabase(':memory:');
	for (const slug of ['billing', 'platform', 'search']) {
		db.prepare('INSERT INTO projects (slug) VALUES (?)').run(slug);
	}
});

describe('createApiKey', () => {
	it('returns the key once and stores only its SHA-256', () => {
		const { key } = createApiKey(db, 'ci', 'all');

		expect(key).toMatch(/^grimoire_[\w-]{43}$/);
		const stored = JSON.stringify(db.prepare('SELECT * FROM api_keys').all());
		expect(stored).not.toContain(key.slice('grimoire_'.length, 20));
		expect(stored).toContain(createHash('sha256').update(key).digest('hex'));
	});

	it('creates a different key every time', () => {
		expect(createApiKey(db, 'a', 'all').key).not.toBe(createApiKey(db, 'b', 'all').key);
	});

	it('stores nothing when a project does not exist', () => {
		expect(() => createApiKey(db, 'ci', ['platform', 'nope'])).toThrow('project "nope"');
		expect(listApiKeys(db)).toEqual([]);
		expect(db.prepare('SELECT count(*) AS n FROM api_key_projects').get()).toEqual({ n: 0 });
	});
});

describe('scopeForKey', () => {
	it('gives an all-projects key every project', () => {
		const { key } = createApiKey(db, 'ci', 'all');

		expect(scopeForKey(db, key, CLOCK)).toEqual({ scope: 'all' });
	});

	it('gives a key with a selection only those projects', () => {
		const { key } = createApiKey(db, 'ci', ['search', 'billing']);
		const { scope } = scopeForKey(db, key, CLOCK)!;

		expect(scope).toEqual(['billing', 'search']);
		expect(listProjects(db, scope).markdown).toBe('- billing\n- search');
	});

	it('rejects unknown keys', () => {
		createApiKey(db, 'ci', 'all');

		expect(scopeForKey(db, 'grimoire_unknown', CLOCK)).toBeUndefined();
		expect(scopeForKey(db, '', CLOCK)).toBeUndefined();
	});

	it('drops a deleted project from the selection', () => {
		const { key } = createApiKey(db, 'ci', ['billing', 'platform']);
		db.prepare("DELETE FROM projects WHERE slug = 'platform'").run();

		expect(scopeForKey(db, key, CLOCK)).toEqual({ scope: ['billing'] });
	});
});

describe('listApiKeys', () => {
	it('lists name and scope, never the key', () => {
		createApiKey(db, 'ci', 'all');
		createApiKey(db, 'agent', ['platform', 'billing']);
		createApiKey(db, 'empty', []);

		const keys = listApiKeys(db);

		expect(keys.map(({ name, projects }) => ({ name, projects }))).toEqual([
			{ name: 'agent', projects: ['billing', 'platform'] },
			{ name: 'ci', projects: 'all' },
			{ name: 'empty', projects: [] }
		]);
		expect(Object.keys(keys[0]).sort()).toEqual([
			'createdAt',
			'id',
			'lastUsedAt',
			'name',
			'projects',
			'validUntil'
		]);
	});

	it('gives the creation time as a UTC instant, which SQLite stores without a zone', () => {
		const { id } = createApiKey(db, 'ci', 'all');
		db.prepare("UPDATE api_keys SET created_at = '2026-10-29 20:24:12' WHERE id = ?").run(id);

		expect(listApiKeys(db)[0].createdAt).toBe('2026-10-29T20:24:12.000Z');
	});
});

describe('revokeApiKey', () => {
	it('stops the key from working at once and leaves other keys alone', () => {
		const revoked = createApiKey(db, 'old', ['platform']);
		const kept = createApiKey(db, 'new', 'all');

		revokeApiKey(db, revoked.id);

		expect(scopeForKey(db, revoked.key, CLOCK)).toBeUndefined();
		expect(scopeForKey(db, kept.key, CLOCK)).toEqual({ scope: 'all' });
		expect(db.prepare('SELECT count(*) AS n FROM api_key_projects').get()).toEqual({ n: 0 });
	});
});

describe('last use', () => {
	it('is unset until the key authenticates a request', () => {
		const { id } = createApiKey(db, 'ci', 'all');

		expect(lastUsed(id)).toBeNull();
		scopeForKey(db, 'grimoire_unknown', CLOCK);
		expect(lastUsed(id)).toBeNull();
	});

	it('is written at most once a minute, however many requests come in between', () => {
		const { id, key } = createApiKey(db, 'ci', 'all');

		scopeForKey(db, key, CLOCK);
		expect(lastUsed(id)).toBe('2026-10-30T12:00:00.000Z');
		scopeForKey(db, key, later(59));
		expect(lastUsed(id)).toBe('2026-10-30T12:00:00.000Z');
		scopeForKey(db, key, later(60));
		expect(lastUsed(id)).toBe('2026-10-30T12:01:00.000Z');
	});
});

describe('expiry', () => {
	it('accepts a key through its last valid day and rejects it the day after', () => {
		const { id, key } = createApiKey(db, 'trial', 'all', '2026-10-30');

		expect(scopeForKey(db, key, CLOCK)).toEqual({ scope: 'all' });
		expect(scopeForKey(db, key, later(86_400, '2026-10-31'))).toBeUndefined();
		// A rejected request is no use of the key.
		expect(lastUsed(id)).toBe('2026-10-30T12:00:00.000Z');
		expect(listApiKeys(db)[0].validUntil).toBe('2026-10-30');
	});

	it('compares calendar dates', () => {
		expect(isExpired(null, '2026-10-30')).toBe(false);
		expect(isExpired('2026-10-30', '2026-10-30')).toBe(false);
		expect(isExpired('2026-10-29', '2026-10-30')).toBe(true);
		expect(isExpired('2026-12-31', '2027-01-01')).toBe(true);
	});

	it('refuses a value that is not a date', () => {
		expect(() => createApiKey(db, 'ci', 'all', 'next week')).toThrow(/CHECK/);
	});
});

describe('updateApiKey', () => {
	it('changes scope and expiry while the same key keeps working', () => {
		const { id, key } = createApiKey(db, 'ci', ['billing'], '2026-10-31');

		updateApiKey(db, id, ['platform', 'search'], null);
		expect(scopeForKey(db, key, CLOCK)).toEqual({ scope: ['platform', 'search'] });
		expect(listApiKeys(db)[0].validUntil).toBeNull();

		updateApiKey(db, id, 'all', '2026-10-29');
		expect(listApiKeys(db)[0].projects).toBe('all');
		expect(scopeForKey(db, key, CLOCK)).toBeUndefined();
		expect(db.prepare('SELECT count(*) AS n FROM api_key_projects').get()).toEqual({ n: 0 });
	});

	it('changes nothing when a project does not exist', () => {
		const { id, key } = createApiKey(db, 'ci', ['billing']);

		expect(() => updateApiKey(db, id, ['nope'], '2026-12-31')).toThrow('project "nope"');
		expect(scopeForKey(db, key, CLOCK)).toEqual({ scope: ['billing'] });
		expect(listApiKeys(db)[0].validUntil).toBeNull();
	});
});
