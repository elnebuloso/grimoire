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

const ALL = ['billing-docs', 'platform-docs', 'search-docs'];
const OWNER = 1;

const CLOCK = { now: new Date('2026-10-30T12:00:00.000Z'), today: '2026-10-30' };

function later(seconds: number, today = CLOCK.today) {
	return { now: new Date(CLOCK.now.getTime() + seconds * 1000), today };
}

function lastUsed(id: number) {
	return listApiKeys(db).find((key) => key.id === id)!.lastUsedAt;
}

beforeEach(() => {
	db = openDatabase(':memory:');
	db.prepare(
		"INSERT INTO users (id, email, password_hash) VALUES (1, 'owner@example.com', 'hash')"
	).run();
	for (const slug of ['billing-docs', 'platform-docs', 'search-docs']) {
		db.prepare(
			"INSERT INTO sources (slug, name, git_url, branch, path, visibility) VALUES (?, 'Docs', 'https://git.example/x.git', 'main', 'docs/', 'internal')"
		).run(slug);
	}
});

// Keys belong to the first user unless a test names another owner, or none.
function newKey(
	...[database, name, sources, validUntil = null, ownerId = OWNER]: Parameters<typeof createApiKey>
) {
	const created = createApiKey(database, name, sources, validUntil, ownerId);
	if ('error' in created) throw new Error(created.error);
	return created;
}

describe('keys of several users', () => {
	let other: number;

	beforeEach(() => {
		other = Number(
			db
				.prepare("INSERT INTO users (email, password_hash) VALUES ('ops@example.com', 'hash')")
				.run().lastInsertRowid
		);
	});

	it("lists only the owner's keys when asked for an owner, with the owner of each", () => {
		newKey(db, 'laptop', 'all');
		newKey(db, 'ci', 'all', null, other);
		expect(listApiKeys(db, other).map((key) => [key.name, key.owner])).toEqual([
			['ci', 'ops@example.com']
		]);
		expect(listApiKeys(db).map((key) => key.owner)).toEqual([
			'ops@example.com',
			'owner@example.com'
		]);
	});

	it("neither changes nor revokes another user's key, but revokes any key without an owner given", () => {
		const { id } = newKey(db, 'laptop', 'all');
		expect(updateApiKey(db, id, ['billing-docs'], null, other)).toEqual({ error: 'unknown-key' });
		revokeApiKey(db, id, other);
		expect(listApiKeys(db)).toHaveLength(1);
		revokeApiKey(db, id);
		expect(listApiKeys(db)).toEqual([]);
	});

	it("refuses another user's private source in a selection", () => {
		db.prepare(
			"UPDATE sources SET visibility = 'private', owner_id = ? WHERE slug = 'search-docs'"
		).run(other);
		expect(createApiKey(db, 'laptop', ['search-docs'], null, OWNER)).toEqual({
			error: 'unknown-source'
		});
		const { id } = newKey(db, 'laptop', ['billing-docs']);
		expect(updateApiKey(db, id, ['search-docs'], null, OWNER)).toEqual({
			error: 'unknown-source'
		});
		expect(newKey(db, 'ops', ['search-docs'], null, other).key).toMatch(/^grimoire_/);
	});
});

describe('createApiKey', () => {
	it('belongs to the user who creates it', () => {
		const owner = Number(
			db
				.prepare("INSERT INTO users (email, password_hash) VALUES ('writer@example.com', 'hash')")
				.run().lastInsertRowid
		);
		const { id } = newKey(db, 'laptop', 'all', null, owner);
		expect(db.prepare('SELECT owner_id FROM api_keys WHERE id = ?').get(id)).toEqual({
			owner_id: owner
		});
	});
});

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

describe('scopeForKey by visibility', () => {
	let writer: number;
	let admin: number;

	beforeEach(() => {
		const insertUser = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, 'hash')");
		writer = Number(insertUser.run('writer@example.com').lastInsertRowid);
		admin = Number(insertUser.run('admin@example.com').lastInsertRowid);
		db.prepare("INSERT INTO user_roles (user_id, role) VALUES (?, 'admin')").run(admin);
		db.prepare(
			"UPDATE sources SET visibility = 'private', owner_id = ? WHERE slug = 'search-docs'"
		).run(writer);
		db.prepare("UPDATE sources SET visibility = 'public' WHERE slug = 'billing-docs'").run();
	});

	function scopeOf(owner: number | null, sources: 'all' | string[] = 'all') {
		return scopeForKey(db, newKey(db, 'laptop', sources, null, owner).key, CLOCK)!.scope;
	}

	it("reads public, internal and the owner's private sources with the owner's key", () => {
		expect(scopeOf(writer)).toEqual(ALL);
	});

	it("never reads another user's private source, not with an admin's key either", () => {
		expect(scopeOf(admin)).toEqual(['billing-docs', 'platform-docs']);
		expect(createApiKey(db, 'admin', ['search-docs'], null, admin)).toEqual({
			error: 'unknown-source'
		});
	});

	it('reads no private source with a key that belongs to nobody', () => {
		expect(scopeOf(null)).toEqual(['billing-docs', 'platform-docs']);
	});

	it('drops a source from other keys once its owner makes it private', () => {
		const key = newKey(db, 'ci', 'all', null, admin).key;
		db.prepare(
			"UPDATE sources SET visibility = 'private', owner_id = ? WHERE slug = 'platform-docs'"
		).run(writer);
		expect(scopeForKey(db, key, CLOCK)!.scope).toEqual(['billing-docs']);
	});

	it('reads only public sources without a key', () => {
		expect(listVisibleSources(db, 'public').markdown).toBe('- billing-docs');
	});
});

describe('scopeForKey', () => {
	it('gives an all-sources key every source', () => {
		const { key } = newKey(db, 'ci', 'all');

		expect(scopeForKey(db, key, CLOCK)).toEqual({ scope: ALL });
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
			'owner',
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
		expect(scopeForKey(db, kept.key, CLOCK)).toEqual({ scope: ALL });
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

		expect(scopeForKey(db, key, CLOCK)).toEqual({ scope: ALL });
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

		updateApiKey(db, id, ['platform-docs', 'search-docs'], null, OWNER);
		expect(scopeForKey(db, key, CLOCK)).toEqual({ scope: ['platform-docs', 'search-docs'] });
		expect(listApiKeys(db)[0].validUntil).toBeNull();

		updateApiKey(db, id, 'all', '2026-10-29', OWNER);
		expect(listApiKeys(db)[0].sources).toBe('all');
		expect(scopeForKey(db, key, CLOCK)).toBeUndefined();
		expect(db.prepare('SELECT count(*) AS n FROM api_key_sources').get()).toEqual({ n: 0 });
	});

	it('narrows a key for all sources to a selection', () => {
		const { id, key } = newKey(db, 'ci', 'all');

		updateApiKey(db, id, ['billing-docs'], null, OWNER);
		expect(scopeForKey(db, key, CLOCK)).toEqual({ scope: ['billing-docs'] });
	});

	it('changes nothing when a source does not exist', () => {
		const { id, key } = newKey(db, 'ci', ['billing-docs']);

		expect(updateApiKey(db, id, ['nope'], '2026-12-31', OWNER)).toEqual({
			error: 'unknown-source'
		});
		expect(scopeForKey(db, key, CLOCK)).toEqual({ scope: ['billing-docs'] });
		expect(listApiKeys(db)[0].validUntil).toBeNull();
	});

	it('changes nothing for a key that no longer exists', () => {
		const { id } = newKey(db, 'ci', 'all');
		revokeApiKey(db, id);

		expect(updateApiKey(db, id, ['billing-docs'], null, OWNER)).toEqual({ error: 'unknown-key' });
		expect(db.prepare('SELECT count(*) AS n FROM api_key_sources').get()).toEqual({ n: 0 });
	});
});

describe('the schema', () => {
	const refusal = /a key for all sources has no selected sources/;

	it('refuses a selected source for a key for all sources', () => {
		const { id } = newKey(db, 'ci', 'all');

		expect(() =>
			db.prepare('INSERT INTO api_key_sources (api_key_id, source_id) VALUES (?, 1)').run(id)
		).toThrow(refusal);
	});

	it('refuses to open all sources to a key that still has a selection', () => {
		const { id } = newKey(db, 'ci', ['billing-docs']);

		expect(() => db.prepare('UPDATE api_keys SET all_sources = 1 WHERE id = ?').run(id)).toThrow(
			refusal
		);
	});
});
