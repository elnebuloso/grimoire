import { describe, it, expect, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from './db/schema';
import { listVisibleSources } from './agent/operations';
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
	for (const slug of ['billing-docs', 'platform-docs', 'search-docs']) {
		db.prepare(
			"INSERT INTO sources (slug, git_url, branch, path) VALUES (?, 'https://git.example/x.git', 'main', 'docs/')"
		).run(slug);
	}
});

function newKey(...args: Parameters<typeof createApiKey>) {
	const created = createApiKey(...args);
	if ('error' in created) throw new Error(created.error);
	return created;
}

describe('createApiKey', () => {
	it('returns the key once and stores only its SHA-256', () => {
		const { key } = newKey(db, 'ci', 'all');

		expect(key).toMatch(/^grimoire_[\w-]{43}$/);
		const stored = JSON.stringify(db.prepare('SELECT * FROM api_keys').all());
		expect(stored).not.toContain(key.slice('grimoire_'.length, 20));
		expect(stored).toContain(createHash('sha256').update(key).digest('hex'));
	});

	it('creates a different key every time', () => {
		expect(newKey(db, 'a', 'all').key).not.toBe(newKey(db, 'b', 'all').key);
	});

	it('stores nothing when a source does not exist', () => {
		expect(createApiKey(db, 'ci', ['platform-docs', 'nope'])).toEqual({ error: 'unknown-source' });
		expect(listApiKeys(db)).toEqual([]);
		expect(db.prepare('SELECT count(*) AS n FROM api_key_sources').get()).toEqual({ n: 0 });
	});
});

describe('scopeForKey', () => {
	it('gives an all-sources key every source', () => {
		const { key } = newKey(db, 'ci', 'all');

		expect(scopeForKey(db, key, CLOCK)).toEqual({ scope: 'all' });
	});

	it('gives a key with a selection only those sources', () => {
		const { key } = newKey(db, 'ci', ['search-docs', 'billing-docs']);
		const { scope } = scopeForKey(db, key, CLOCK)!;

		expect(scope).toEqual(['billing-docs', 'search-docs']);
		expect(listVisibleSources(db, scope).markdown).toBe('- billing-docs\n- search-docs');
	});

	it('rejects unknown keys', () => {
		newKey(db, 'ci', 'all');

		expect(scopeForKey(db, 'grimoire_unknown', CLOCK)).toBeUndefined();
		expect(scopeForKey(db, '', CLOCK)).toBeUndefined();
	});

	it('drops a deleted source from the selection', () => {
		const { key } = newKey(db, 'ci', ['billing-docs', 'platform-docs']);
		db.prepare("DELETE FROM sources WHERE slug = 'platform-docs'").run();

		expect(scopeForKey(db, key, CLOCK)).toEqual({ scope: ['billing-docs'] });
	});
});

describe('listApiKeys', () => {
	it('lists name and scope, never the key', () => {
		newKey(db, 'ci', 'all');
		newKey(db, 'agent', ['platform-docs', 'billing-docs']);
		newKey(db, 'empty', []);

		const keys = listApiKeys(db);

		expect(keys.map(({ name, sources }) => ({ name, sources }))).toEqual([
			{ name: 'agent', sources: ['billing-docs', 'platform-docs'] },
			{ name: 'ci', sources: 'all' },
			{ name: 'empty', sources: [] }
		]);
		expect(Object.keys(keys[0]).sort()).toEqual([
			'createdAt',
			'id',
			'lastUsedAt',
			'name',
			'sources',
			'validUntil'
		]);
	});

	it('stores the creation time as ISO 8601 in UTC with milliseconds and Z', () => {
		newKey(db, 'ci', 'all');

		const { createdAt } = listApiKeys(db)[0];
		expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		expect(new Date(createdAt).toISOString()).toBe(createdAt);
	});
});

describe('revokeApiKey', () => {
	it('stops the key from working at once and leaves other keys alone', () => {
		const revoked = newKey(db, 'old', ['platform-docs']);
		const kept = newKey(db, 'new', 'all');

		revokeApiKey(db, revoked.id);

		expect(scopeForKey(db, revoked.key, CLOCK)).toBeUndefined();
		expect(scopeForKey(db, kept.key, CLOCK)).toEqual({ scope: 'all' });
		expect(db.prepare('SELECT count(*) AS n FROM api_key_sources').get()).toEqual({ n: 0 });
	});
});

describe('last use', () => {
	it('is unset until the key authenticates a request', () => {
		const { id } = newKey(db, 'ci', 'all');

		expect(lastUsed(id)).toBeNull();
		scopeForKey(db, 'grimoire_unknown', CLOCK);
		expect(lastUsed(id)).toBeNull();
	});

	it('is written at most once a minute, however many requests come in between', () => {
		const { id, key } = newKey(db, 'ci', 'all');

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
		const { id, key } = newKey(db, 'trial', 'all', '2026-10-30');

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
		const { id, key } = newKey(db, 'ci', ['billing-docs'], '2026-10-31');

		updateApiKey(db, id, ['platform-docs', 'search-docs'], null);
		expect(scopeForKey(db, key, CLOCK)).toEqual({ scope: ['platform-docs', 'search-docs'] });
		expect(listApiKeys(db)[0].validUntil).toBeNull();

		updateApiKey(db, id, 'all', '2026-10-29');
		expect(listApiKeys(db)[0].sources).toBe('all');
		expect(scopeForKey(db, key, CLOCK)).toBeUndefined();
		expect(db.prepare('SELECT count(*) AS n FROM api_key_sources').get()).toEqual({ n: 0 });
	});

	it('changes nothing when a source does not exist', () => {
		const { id, key } = newKey(db, 'ci', ['billing-docs']);

		expect(updateApiKey(db, id, ['nope'], '2026-12-31')).toEqual({ error: 'unknown-source' });
		expect(scopeForKey(db, key, CLOCK)).toEqual({ scope: ['billing-docs'] });
		expect(listApiKeys(db)[0].validUntil).toBeNull();
	});

	it('changes nothing for a key that no longer exists', () => {
		const { id } = newKey(db, 'ci', 'all');
		revokeApiKey(db, id);

		expect(updateApiKey(db, id, ['billing-docs'], null)).toEqual({ error: 'unknown-key' });
		expect(db.prepare('SELECT count(*) AS n FROM api_key_sources').get()).toEqual({ n: 0 });
	});
});
