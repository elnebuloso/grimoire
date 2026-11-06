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
	beforeEach(() => {
		db.prepare("UPDATE sources SET visibility = 'public' WHERE slug = 'billing-docs'").run();
	});

	it('reads public and internal sources with the key of any user, or of nobody', () => {
		const user = Number(
			db
				.prepare("INSERT INTO users (email, password_hash) VALUES ('writer@example.com', 'hash')")
				.run().lastInsertRowid
		);
		for (const owner of [user, null]) {
			const { key } = newKey(db, 'laptop', 'all', null, owner);
			expect(scopeForKey(db, key, CLOCK)!.scope).toBe('all');
		}
	});

	it('reads only public sources without a key', () => {
		expect(listVisibleSources(db, 'public').markdown).toBe('- billing-docs');
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
			'owner',
			'requests',
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

describe('requests per day', () => {
	function written() {
		return db
			.prepare('SELECT day, requests FROM api_key_requests ORDER BY day')
			.all()
			.map((row) => ({ ...row }));
	}

	function requestsOf(id: number) {
		return listApiKeys(db).find((key) => key.id === id)!.requests;
	}

	it('counts every request, but writes the counts at most once a minute', () => {
		const { id, key } = newKey(db, 'ci', 'all');
		scopeForKey(db, key, CLOCK);
		scopeForKey(db, key, later(10));
		scopeForKey(db, key, later(20));

		expect(written()).toEqual([{ day: '2026-10-30', requests: 1 }]);
		expect(requestsOf(id)).toEqual([{ day: '2026-10-30', requests: 3 }]);

		scopeForKey(db, key, later(60));
		expect(written()).toEqual([{ day: '2026-10-30', requests: 4 }]);
	});

	it('counts on the calendar day of the instance, the latest day first', () => {
		const { id, key } = newKey(db, 'ci', 'all');
		scopeForKey(db, key, CLOCK);
		scopeForKey(db, key, later(3_600, '2026-10-31'));
		scopeForKey(db, key, later(3_660, '2026-10-31'));

		expect(requestsOf(id)).toEqual([
			{ day: '2026-10-31', requests: 2 },
			{ day: '2026-10-30', requests: 1 }
		]);
	});

	it('removes days older than 90 days and the counts of a revoked key', () => {
		const { id, key } = newKey(db, 'ci', 'all');
		const other = newKey(db, 'laptop', 'all');
		db.prepare(
			"INSERT INTO api_key_requests (api_key_id, day, requests) VALUES (?, '2026-08-01', 7), (?, '2026-08-02', 9)"
		).run(id, id);
		scopeForKey(db, key, CLOCK);
		expect(requestsOf(id)).toEqual([
			{ day: '2026-10-30', requests: 1 },
			{ day: '2026-08-02', requests: 9 }
		]);

		scopeForKey(db, other.key, CLOCK);
		revokeApiKey(db, id);
		expect(written()).toEqual([{ day: '2026-10-30', requests: 1 }]);
		expect(requestsOf(other.id)).toEqual([{ day: '2026-10-30', requests: 1 }]);
	});

	it('counts no request with an unknown or expired key', () => {
		const { id, key } = newKey(db, 'ci', 'all', '2026-10-29');
		scopeForKey(db, key, CLOCK);
		scopeForKey(db, 'grimoire_unknown', CLOCK);
		expect(requestsOf(id)).toEqual([]);
	});
});
