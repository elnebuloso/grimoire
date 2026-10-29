import { describe, it, expect, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from './db/schema';
import { listProjects } from './agent/operations';
import { createApiKey, listApiKeys, revokeApiKey, scopeForKey } from './api-keys';

let db: DatabaseSync;

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

		expect(scopeForKey(db, key)).toEqual({ scope: undefined });
	});

	it('gives a key with a selection only those projects', () => {
		const { key } = createApiKey(db, 'ci', ['search', 'billing']);
		const { scope } = scopeForKey(db, key)!;

		expect(scope).toEqual(['billing', 'search']);
		expect(listProjects(db, scope).markdown).toBe('- billing\n- search');
	});

	it('rejects unknown keys', () => {
		createApiKey(db, 'ci', 'all');

		expect(scopeForKey(db, 'grimoire_unknown')).toBeUndefined();
		expect(scopeForKey(db, '')).toBeUndefined();
	});

	it('drops a deleted project from the selection', () => {
		const { key } = createApiKey(db, 'ci', ['billing', 'platform']);
		db.prepare("DELETE FROM projects WHERE slug = 'platform'").run();

		expect(scopeForKey(db, key)).toEqual({ scope: ['billing'] });
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
		expect(Object.keys(keys[0]).sort()).toEqual(['createdAt', 'id', 'name', 'projects']);
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

		expect(scopeForKey(db, revoked.key)).toBeUndefined();
		expect(scopeForKey(db, kept.key)).toEqual({ scope: undefined });
		expect(db.prepare('SELECT count(*) AS n FROM api_key_projects').get()).toEqual({ n: 0 });
	});
});
